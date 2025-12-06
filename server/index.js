// server/index.js
import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5004

// CORS - allow frontend origin via env or default to localhost
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json())

// Mongoose connection
const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI
if (!mongoUrl) console.warn('No MONGO_URL/MONGO_URI found in env')

mongoose
  .connect(mongoUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

// --------------------
// Schemas & Models
// --------------------

// User
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  portfolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', default: null }
}, { timestamps: true })

const UserModel = mongoose.model('User', UserSchema)

// Project
const ProjectSchema = new mongoose.Schema({
  portfolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  title: String,
  description: String,
  techStack: [String]
}, { timestamps: true })

const ProjectModel = mongoose.model('Project', ProjectSchema)

// Portfolio (extended)
const PortfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  bio: String,
  summary: String,           // short headline
  jobTitle: String,
  avatarUrl: String,         // link to profile image
  resumeUrl: String,         // link to resume file
  skills: [{ type: String }],// array of skill strings
  socials: {                 // social links
    linkedin: String,
    github: String,
    twitter: String
  },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
}, { timestamps: true })

const PortfolioModel = mongoose.model('Portfolio', PortfolioSchema)

// --------------------
// Helpers & Middleware
// --------------------

const safeUser = (user) => {
  if (!user) return user
  const u = user.toObject ? user.toObject() : user
  // remove password before returning
  delete u.password
  return u
}

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json('No token provided')

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json('Invalid token')
    req.user = decoded // decoded should contain { id: userId, iat, exp }
    next()
  })
}

// --------------------
// Routes
// --------------------

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Register
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json('Missing fields')

    if (await UserModel.findOne({ email })) return res.status(400).json('User already exists')

    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)

    const user = await UserModel.create({ name, email, password: hashed })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({ user: safeUser(user), token })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json('User already exists')
    console.error('Register error:', err)
    res.status(500).json('Error registering user')
  }
})

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json('Missing fields')

    const user = await UserModel.findOne({ email })
    if (!user) return res.status(400).json('User not found')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json('Invalid password')

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.status(200).json({ user: safeUser(user), token })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json('Error logging in')
  }
})

// Create Portfolio
app.post('/createPortfolio', verifyToken, async (req, res) => {
  try {
    const existing = await PortfolioModel.findOne({ user: req.user.id })
    if (existing) return res.status(400).json('Portfolio already exists')

    const {
      bio,
      jobTitle,
      summary,
      avatarUrl,
      resumeUrl,
      skills = [],
      socials = {}
    } = req.body

    const portfolio = await PortfolioModel.create({
      user: req.user.id,
      bio,
      jobTitle,
      summary,
      avatarUrl,
      resumeUrl,
      skills,
      socials
    })

    await UserModel.findByIdAndUpdate(req.user.id, { portfolio: portfolio._id })
    const populated = await PortfolioModel.findById(portfolio._id).populate('projects')
    res.status(200).json(populated)
  } catch (err) {
    console.error('Create portfolio error:', err)
    res.status(500).json('Error creating portfolio')
  }
})

// Get Portfolio
app.get('/getPortfolio/:id', verifyToken, async (req, res) => {
  try {
    const portfolio = await PortfolioModel.findById(req.params.id).populate('projects')
    if (!portfolio) return res.status(404).json('Portfolio not found')
    res.status(200).json(portfolio)
  } catch (err) {
    console.error('Get portfolio error:', err)
    res.status(500).json('Error fetching portfolio')
  }
})

// Update Portfolio
app.put('/updatePortfolio/:id', verifyToken, async (req, res) => {
  try {
    const portfolio = await PortfolioModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('projects')
    if (!portfolio) return res.status(404).json('Portfolio not found')
    res.status(200).json(portfolio)
  } catch (err) {
    console.error('Update portfolio error:', err)
    res.status(500).json('Error updating portfolio')
  }
})

// Delete Portfolio (and its projects)
app.delete('/deletePortfolio/:id', verifyToken, async (req, res) => {
  try {
    const portfolio = await PortfolioModel.findById(req.params.id)
    if (!portfolio) return res.status(404).json('Portfolio not found')

    // only owner can delete
    if (portfolio.user.toString() !== req.user.id) return res.status(403).json('Not allowed')

    // delete projects first
    await ProjectModel.deleteMany({ portfolio: portfolio._id })
    await PortfolioModel.findByIdAndDelete(req.params.id)
    await UserModel.findByIdAndUpdate(req.user.id, { portfolio: null })

    res.status(200).json('Portfolio deleted successfully')
  } catch (err) {
    console.error('Delete portfolio error:', err)
    res.status(500).json('Error deleting portfolio')
  }
})

// Create project under a portfolio
app.post('/portfolio/:portfolioId/projects', verifyToken, async (req, res) => {
  try {
    const { portfolioId } = req.params
    const portfolio = await PortfolioModel.findById(portfolioId)
    if (!portfolio) return res.status(404).json('Portfolio not found')
    if (portfolio.user.toString() !== req.user.id) return res.status(403).json('Not allowed')

    const { title, description, techStack = [] } = req.body
    const project = await ProjectModel.create({
      portfolio: portfolioId,
      title,
      description,
      techStack
    })

    portfolio.projects.push(project._id)
    await portfolio.save()
    const populated = await PortfolioModel.findById(portfolioId).populate('projects')
    res.status(201).json(populated)
  } catch (err) {
    console.error('Create project error:', err)
    res.status(500).json('Error creating project')
  }
})

// Delete project
app.delete('/portfolio/:portfolioId/projects/:projectId', verifyToken, async (req, res) => {
  try {
    const { portfolioId, projectId } = req.params
    const portfolio = await PortfolioModel.findById(portfolioId)
    if (!portfolio) return res.status(404).json('Portfolio not found')
    if (portfolio.user.toString() !== req.user.id) return res.status(403).json('Not allowed')

    await ProjectModel.findByIdAndDelete(projectId)
    portfolio.projects = portfolio.projects.filter(pid => pid.toString() !== projectId)
    await portfolio.save()
    const populated = await PortfolioModel.findById(portfolioId).populate('projects')
    res.status(200).json(populated)
  } catch (err) {
    console.error('Delete project error:', err)
    res.status(500).json('Error deleting project')
  }
})

// --------------------
// Optionally serve client build when SERVE_CLIENT=true
// Useful if you want single deployment on Render (optional)
import path from 'path'
const __dirname = path.resolve()
if (process.env.SERVE_CLIENT === 'true') {
  const clientDist = path.join(__dirname, 'client', 'dist')
  app.use(express.static(clientDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// Start server
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`))

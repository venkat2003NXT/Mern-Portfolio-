// server/index.js
import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import jwt from 'jsonwebtoken'
dotenv.config()

const app = express();
const PORT = process.env.PORT || 5004

// CORS - allow frontend origin via env or default to localhost
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173"
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// DB connection (your env uses MONGO_URL)
const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI
if (!mongoUrl) console.warn("No MONGO_URL/MONGO_URI found in env")
mongoose.connect(mongoUrl)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err))

// Schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  portfolio: { type: mongoose.Schema.Types.ObjectId, ref: "Portfolio", default: null }
})
const UserModel = mongoose.model("User", UserSchema)

const ProjectSchema = new mongoose.Schema({
  portfolio: { type: mongoose.Schema.Types.ObjectId, ref: "Portfolio" },
  title: String,
  description: String,
  techStack: [String]
})
const ProjectModel = mongoose.model("Project", ProjectSchema)

const PortfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  bio: String,
  jobTitle: String,
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }]
})
const PortfolioModel = mongoose.model("Portfolio", PortfolioSchema)

// Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return res.status(401).json("No token provided")

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json("Invalid token")
    // decoded contains { id: user._id, iat, exp } because we sign that way
    req.user = decoded
    next()
  })
}

// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (await UserModel.findOne({ email })) return res.status(400).json("User already exists")
    const user = await UserModel.create({ name, email, password })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" })
    res.status(201).json({ user, token })
  } catch (err) {
    console.log(err.message)
    res.status(500).json("Error registering user")
  }
})

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await UserModel.findOne({ email })
    if (!user) return res.status(400).json("User not found")
    if (password !== user.password) return res.status(400).json("Invalid password")
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" })
    res.status(200).json({ user, token })
  } catch (err) {
    console.log(err.message)
    res.status(500).json("Error logging in")
  }
})

// Create Portfolio
app.post("/createPortfolio", verifyToken, async (req, res) => {
  try {
    const existing = await PortfolioModel.findOne({ user: req.user.id });
    if (existing) return res.status(400).json("Portfolio already exists");

    const { bio, jobTitle } = req.body;
    const portfolio = await PortfolioModel.create({
      user: req.user.id,
      bio,
      jobTitle
    });

    await UserModel.findByIdAndUpdate(req.user.id, { portfolio: portfolio._id });

    // populate projects (empty)
    const populated = await PortfolioModel.findById(portfolio._id).populate("projects")
    res.status(200).json(populated);
  } catch (err) {
    console.log(err.message);
    res.status(500).json("Error creating portfolio");
  }
});

// Get Portfolio
app.get("/getPortfolio/:id", verifyToken, async (req, res) => {
  try {
    const portfolio = await PortfolioModel.findById(req.params.id).populate("projects")
    if (!portfolio) return res.status(404).json("Portfolio not found")
    res.status(200).json(portfolio)
  } catch (err) {
    console.log(err.message)
    res.status(500).json("Error fetching portfolio")
  }
})

// Update Portfolio
app.put("/updatePortfolio/:id", verifyToken, async (req, res) => {
  try {
    const portfolio = await PortfolioModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("projects")
    res.status(200).json(portfolio)
  } catch (err) {
    console.log(err.message)
    res.status(500).json("Error updating portfolio")
  }
})

// Delete Portfolio
app.delete("/deletePortfolio/:id", verifyToken, async (req, res) => {
  try {
    // Delete all projects under portfolio first
    const portfolio = await PortfolioModel.findById(req.params.id)
    if (portfolio) {
      await ProjectModel.deleteMany({ portfolio: portfolio._id })
      await PortfolioModel.findByIdAndDelete(req.params.id);
      await UserModel.findByIdAndUpdate(req.user.id, { portfolio: null });
    }
    res.status(200).json("Portfolio deleted successfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).json("Error deleting portfolio");
  }
});

//
// Project endpoints (new)
//

// Create project under a portfolio
app.post("/portfolio/:portfolioId/projects", verifyToken, async (req, res) => {
  try {
    const { portfolioId } = req.params
    const portfolio = await PortfolioModel.findById(portfolioId)
    if (!portfolio) return res.status(404).json("Portfolio not found")
    // only owner can add (check)
    if (portfolio.user.toString() !== req.user.id) return res.status(403).json("Not allowed")

    const { title, description, techStack } = req.body
    const project = await ProjectModel.create({
      portfolio: portfolioId,
      title,
      description,
      techStack
    })
    portfolio.projects.push(project._id)
    await portfolio.save()
    const populated = await PortfolioModel.findById(portfolioId).populate("projects")
    res.status(201).json(populated)
  } catch (err) {
    console.log(err.message)
    res.status(500).json("Error creating project")
  }
})

// Delete project
app.delete("/portfolio/:portfolioId/projects/:projectId", verifyToken, async (req, res) => {
  try {
    const { portfolioId, projectId } = req.params
    const portfolio = await PortfolioModel.findById(portfolioId)
    if (!portfolio) return res.status(404).json("Portfolio not found")
    if (portfolio.user.toString() !== req.user.id) return res.status(403).json("Not allowed")
    await ProjectModel.findByIdAndDelete(projectId)
    portfolio.projects = portfolio.projects.filter(pid => pid.toString() !== projectId)
    await portfolio.save()
    const populated = await PortfolioModel.findById(portfolioId).populate("projects")
    res.status(200).json(populated)
  } catch (err) {
    console.log(err.message)
    res.status(500).json("Error deleting project")
  }
})

// Health
app.get("/health", (req, res) => res.json({ status: "ok" }))

// Start
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`))

// client/src/components/Register.jsx
import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError(null)
  try {
    const response = await api.post("/register", {
      name,
      email,
      password
    })
    const { user, token } = response.data
    // Save token & user to localStorage so Dashboard and ProtectedRoutes can use them
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    // navigate to dashboard
    navigate("/dashboard")
  } catch (err) {
    console.log(err.response?.data || err.message)
    setError(err.response?.data || "Registration failed")
  }
}

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-blue-200 gap-4'>
      <h1 className='text-2xl font-semibold'>Register</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-[320px]">
        <input
          type="text"
          placeholder="username"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className='border border-black p-2 rounded'
          required
        />
        <input
          type="email"
          placeholder='email'
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className='border border-black p-2 rounded'
          required
        />
        <input
          type="password"
          placeholder='password'
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className='border border-black p-2 rounded'
          required
        />
        <button className='bg-blue-600 text-white px-4 py-2 rounded' type="submit">Register</button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
      <Link to="/">Go to Login</Link>
    </div>
  )
}

export default Register

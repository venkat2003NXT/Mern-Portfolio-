// client/src/components/Login.jsx
import React, { useState } from 'react'
import api from "../api"
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      const response = await api.post("/login", { email, password })

      const { user, token } = response.data
      // persist
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
      setError(err.response?.data || "Login failed")
    } finally {
      setEmail('')
      setPassword('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className='text-2xl font-bold'>Login</h1>
      <form className="flex flex-col gap-3 w-[320px]" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder='email'
          className="border border-gray-300 p-2 rounded-md w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required />
        <input
          type="password"
          placeholder='password'
          className="border border-gray-300 p-2 rounded-md w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required />
        <button
          type="submit"
          className="border border-black px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-700 hover:text-white transition duration-100 ease-in-out"
        >
          Login
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
      <Link to="/register">Go to Register</Link>
    </div>
  )
}

export default Login

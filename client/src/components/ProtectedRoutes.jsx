// client/src/components/ProtectedRoutes.jsx
import React from "react"
import { Navigate, Outlet } from "react-router-dom"

const ProtectedRoutes = () => {
  const token = localStorage.getItem("token")
  return token ? <Outlet /> : <Navigate to="/" />
}

export default ProtectedRoutes

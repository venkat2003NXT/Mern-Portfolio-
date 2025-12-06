import './App.css'

import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import {Routes, Route} from 'react-router-dom';
import ProtectedRoutes from './components/ProtectedRoutes';
function App() {

  return (
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/dashboard' element={<ProtectedRoutes />}>
        <Route index element={<Dashboard />} />
      </Route>
    </Routes>
    
  )
}

export default App

// client/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from "axios"

const Dashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")))
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)

  const [bioInput, setBioInput] = useState("")
  const [jobTitleInput, setJobTitleInput] = useState("")

  // project fields
  const [projectTitle, setProjectTitle] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectTechs, setProjectTechs] = useState("")

  const navigate = useNavigate();
  const token = localStorage.getItem("token")

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    navigate("/")
  }

  useEffect(() => {
    if (user?.portfolio) {
      fetchPortfolio()
    }
  }, [user])

  const fetchPortfolio = async () => {
    if (!user?.portfolio) return
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(
        `http://localhost:5004/getPortfolio/${user?.portfolio}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setPortfolio(response.data)
    } catch (error) {
      console.log(error.response?.data || error.message)
      setError(error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePortfolio = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        "http://localhost:5004/createPortfolio",
        {
          bio: bioInput,
          jobTitle: jobTitleInput
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const updatedUser = { ...user, portfolio: response.data._id }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setPortfolio(response.data)
      setShowCreateModal(false)
      setBioInput("")
      setJobTitleInput("")
    } catch (error) {
      console.log(error.response?.data || error.message)
      setError(error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePortfolio = async () => {
    if (!user?.portfolio) return
    setLoading(true)
    setError(null)
    try {
      const response = await axios.put(
        `http://localhost:5004/updatePortfolio/${user?.portfolio}`,
        {
          bio: bioInput,
          jobTitle: jobTitleInput
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setPortfolio(response.data)
      setShowEditModal(false)
    } catch (error) {
      console.log(error.response?.data || error.message)
      setError(error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const deletePortfolio = async () => {
    if (!user?.portfolio) return
    setLoading(true)
    setError(null)
    try {
      await axios.delete(
        `http://localhost:5004/deletePortfolio/${user?.portfolio}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const updatedUser = { ...user, portfolio: null }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setPortfolio(null)
    } catch (error) {
      console.log(error.response?.data || error.message)
      setError(error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  // Project CRUD (client side uses these endpoints added on the server below)
  const handleCreateProject = async () => {
    if (!user?.portfolio) return
    setLoading(true)
    setError(null)
    try {
      const techArray = projectTechs.split(",").map(t => t.trim()).filter(Boolean)
      const res = await axios.post(
        `http://localhost:5004/portfolio/${user.portfolio}/projects`,
        {
          title: projectTitle,
          description: projectDescription,
          techStack: techArray
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      // server returns updated portfolio with projects populated
      setPortfolio(res.data)
      setShowProjectModal(false)
      setProjectTitle("")
      setProjectDescription("")
      setProjectTechs("")
    } catch (err) {
      console.log(err.response?.data || err.message)
      setError(err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!user?.portfolio) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.delete(
        `http://localhost:5004/portfolio/${user.portfolio}/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setPortfolio(res.data)
    } catch (err) {
      console.log(err.response?.data || err.message)
      setError(err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setBioInput("")
    setJobTitleInput("")
    setShowCreateModal(true)
  }

  const openEditModal = () => {
    setBioInput(portfolio?.bio || "")
    setJobTitleInput(portfolio?.jobTitle || "")
    setShowEditModal(true)
  }

  return (
    <div className="flex flex-col items-center gap-3 justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-lg">{user?.name}</p>
      <p className="text-lg">{user?.email}</p>

      {loading && <p className="text-sm text-gray-600">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {
        portfolio ? (
          <div className="text-center border rounded-lg px-4 py-3 bg-gray-100 w-full max-w-xl">
            <h2 className="font-semibold text-lg">{portfolio.bio}</h2>
            <h3 className="text-gray-600">{portfolio.jobTitle}</h3>

            {/* Projects */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Projects</h4>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="text-sm bg-blue-500 px-3 py-1 rounded text-white"
                >
                  Add Project
                </button>
              </div>

              {portfolio.projects?.length ? (
                <ul className="space-y-2">
                  {portfolio.projects.map(p => (
                    <li key={p._id} className="border p-3 rounded bg-white flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{p.title}</h5>
                        <p className="text-sm text-gray-700">{p.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{(p.techStack || []).join(", ")}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleDeleteProject(p._id)}
                          className="text-sm bg-red-500 px-2 py-1 rounded text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No projects added yet.</p>
              )}
            </div>
          </div>
        ) : (
          <h2 className="text-red-500">No portfolio found</h2>
        )
      }

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={fetchPortfolio}
          className="bg-blue-500 px-6 py-3 rounded-lg text-white"
        >
          Fetch Portfolio
        </button>
        <button
          onClick={openCreateModal}
          disabled={!!user?.portfolio || loading}
          className="bg-green-500 px-6 py-3 rounded-lg text-white disabled:bg-gray-400"
        >
          Create Portfolio
        </button>
        <button
          onClick={openEditModal}
          disabled={!portfolio || loading}
          className="bg-yellow-500 px-6 py-3 rounded-lg text-white disabled:bg-gray-400"
        >
          Update Portfolio
        </button>
        <button
          onClick={deletePortfolio}
          disabled={!user?.portfolio || loading}
          className="bg-red-500 px-6 py-3 rounded-lg text-white disabled:bg-gray-400"
        >
          Delete Portfolio
        </button>
        <button
          onClick={logout}
          className="bg-gray-700 px-6 py-3 rounded-lg text-white"
        >
          Logout
        </button>
      </div>

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 w-[320px] shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create Portfolio</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Bio"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Job Title"
                value={jobTitleInput}
                onChange={(e) => setJobTitleInput(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePortfolio}
                  className="px-4 py-2 rounded bg-green-500 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Portfolio Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 w-[320px] shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Portfolio</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Bio"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Job Title"
                value={jobTitleInput}
                onChange={(e) => setJobTitleInput(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePortfolio}
                  className="px-4 py-2 rounded bg-yellow-500 text-white"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 w-[420px] shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Add Project</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <textarea
                placeholder="Description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Techs (comma separated)"
                value={projectTechs}
                onChange={(e) => setProjectTechs(e.target.value)}
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button onClick={handleCreateProject} className="px-4 py-2 rounded bg-blue-600 text-white">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard

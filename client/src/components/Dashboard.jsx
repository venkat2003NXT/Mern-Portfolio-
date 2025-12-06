// client/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from "../api"


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
  const [summaryInput, setSummaryInput] = useState("")
  const [avatarInput, setAvatarInput] = useState("")
  const [resumeInput, setResumeInput] = useState("")
  const [skillsInput, setSkillsInput] = useState("") // comma-separated
  const [linkedinInput, setLinkedinInput] = useState("")
  const [githubInput, setGithubInput] = useState("")

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
      const response = await api.get(`/getPortfolio/${user?.portfolio}`, {
  headers: { Authorization: `Bearer ${token}` }
});

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
      const payload = {
        bio: bioInput,
        jobTitle: jobTitleInput,
        summary: summaryInput,
        avatarUrl: avatarInput,
        resumeUrl: resumeInput,
        skills: skillsInput.split(",").map(s => s.trim()).filter(Boolean),
        socials: { linkedin: linkedinInput, github: githubInput }
      }

      const response = await api.post("/createPortfolio", {
  bio: bioInput,
  jobTitle: jobTitleInput,
  summary,
  avatarUrl,
  resumeUrl,
  skills,
  socials
}, {
  headers: { Authorization: `Bearer ${token}` }
});


      const updatedUser = { ...user, portfolio: response.data._id }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setPortfolio(response.data)
      setShowCreateModal(false)
      // reset inputs
      setBioInput("")
      setJobTitleInput("")
      setSummaryInput("")
      setAvatarInput("")
      setResumeInput("")
      setSkillsInput("")
      setLinkedinInput("")
      setGithubInput("")
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
      const payload = {
        bio: bioInput,
        jobTitle: jobTitleInput,
        summary: summaryInput,
        avatarUrl: avatarInput,
        resumeUrl: resumeInput,
        skills: skillsInput.split(",").map(s => s.trim()).filter(Boolean),
        socials: { linkedin: linkedinInput, github: githubInput }
      }

      const response = await api.put(`/updatePortfolio/${user?.portfolio}`, {
  bio: bioInput,
  jobTitle: jobTitleInput,
  summary,
  avatarUrl,
  resumeUrl,
  skills,
  socials
}, {
  headers: { Authorization: `Bearer ${token}` }
});

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
      await api.delete(`/deletePortfolio/${user?.portfolio}`, {
  headers: { Authorization: `Bearer ${token}` }
});


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

  // Project CRUD
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
    setSummaryInput("")
    setAvatarInput("")
    setResumeInput("")
    setSkillsInput("")
    setLinkedinInput("")
    setGithubInput("")
    setShowCreateModal(true)
  }

  const openEditModal = () => {
    setBioInput(portfolio?.bio || "")
    setJobTitleInput(portfolio?.jobTitle || "")
    setSummaryInput(portfolio?.summary || "")
    setAvatarInput(portfolio?.avatarUrl || "")
    setResumeInput(portfolio?.resumeUrl || "")
    setSkillsInput((portfolio?.skills || []).join(", "))
    setLinkedinInput(portfolio?.socials?.linkedin || "")
    setGithubInput(portfolio?.socials?.github || "")
    setShowEditModal(true)
  }

  return (
    <div className="flex flex-col items-center gap-3 justify-start min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-lg">{user?.name} • {user?.email}</p>
          </div>
          <div>
            <button onClick={logout} className="bg-gray-700 px-4 py-2 rounded text-white">Logout</button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-600">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {
          portfolio ? (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex gap-4">
                <div>
                  {portfolio.avatarUrl ? (
                    <img src={portfolio.avatarUrl} alt="avatar" className="w-28 h-28 rounded-full object-cover border" />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{portfolio.summary || portfolio.bio}</h2>
                  <p className="text-gray-600">{portfolio.jobTitle}</p>
                  <p className="mt-2 text-gray-700">{portfolio.bio}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(portfolio.skills || []).map((s, i) => (
                      <span key={i} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{s}</span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    {portfolio.socials?.linkedin && (
                      <a href={portfolio.socials.linkedin} target="_blank" rel="noreferrer" className="text-sm underline">LinkedIn</a>
                    )}
                    {portfolio.socials?.github && (
                      <a href={portfolio.socials.github} target="_blank" rel="noreferrer" className="text-sm underline">GitHub</a>
                    )}
                    {portfolio.resumeUrl && (
                      <a href={portfolio.resumeUrl} target="_blank" rel="noreferrer" className="ml-4 inline-block bg-slate-800 text-white px-3 py-1 rounded">Resume</a>
                    )}
                  </div>
                </div>
              </div>

              {/* Projects section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Projects</h4>
                  <button onClick={() => setShowProjectModal(true)} className="text-sm bg-blue-500 px-3 py-1 rounded text-white">Add Project</button>
                </div>

                {portfolio.projects?.length ? (
                  <ul className="space-y-2">
                    {portfolio.projects.map(p => (
                      <li key={p._id} className="border p-3 rounded bg-gray-50 flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{p.title}</h5>
                          <p className="text-sm text-gray-700">{p.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{(p.techStack || []).join(", ")}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handleDeleteProject(p._id)} className="text-sm bg-red-500 px-2 py-1 rounded text-white">Delete</button>
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
            <div className="bg-white p-6 rounded shadow mb-6">
              <h2 className="text-lg font-semibold text-red-500">No portfolio found</h2>
              <p className="text-sm text-gray-600">Create a professional portfolio to showcase your work.</p>
            </div>
          )
        }

        {/* Action buttons */}
        <div className="flex gap-3 mb-8">
          <button onClick={fetchPortfolio} className="bg-blue-500 px-4 py-2 rounded text-white">Fetch Portfolio</button>
          <button onClick={openCreateModal} disabled={!!user?.portfolio || loading} className="bg-green-500 px-4 py-2 rounded text-white disabled:bg-gray-300">Create Portfolio</button>
          <button onClick={openEditModal} disabled={!portfolio || loading} className="bg-yellow-500 px-4 py-2 rounded text-white disabled:bg-gray-300">Update Portfolio</button>
          <button onClick={deletePortfolio} disabled={!user?.portfolio || loading} className="bg-red-500 px-4 py-2 rounded text-white disabled:bg-gray-300">Delete Portfolio</button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white rounded-lg p-6 w-[520px] shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Create Portfolio</h2>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Summary / Headline" value={summaryInput} onChange={(e) => setSummaryInput(e.target.value)} className="border px-3 py-2 rounded" />
                <input type="text" placeholder="Job Title" value={jobTitleInput} onChange={(e) => setJobTitleInput(e.target.value)} className="border px-3 py-2 rounded" />
                <input type="text" placeholder="Avatar URL" value={avatarInput} onChange={(e) => setAvatarInput(e.target.value)} className="border px-3 py-2 rounded col-span-2" />
                <input type="text" placeholder="Resume URL" value={resumeInput} onChange={(e) => setResumeInput(e.target.value)} className="border px-3 py-2 rounded col-span-2" />
                <input type="text" placeholder="Skills (comma separated)" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="border px-3 py-2 rounded col-span-2" />
                <input type="url" placeholder="LinkedIn URL" value={linkedinInput} onChange={(e) => setLinkedinInput(e.target.value)} className="border px-3 py-2 rounded" />
                <input type="url" placeholder="GitHub URL" value={githubInput} onChange={(e) => setGithubInput(e.target.value)} className="border px-3 py-2 rounded" />
                <textarea placeholder="Bio / About" value={bioInput} onChange={(e)=>setBioInput(e.target.value)} className="border px-3 py-2 rounded col-span-2" />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button onClick={handleCreatePortfolio} className="px-4 py-2 rounded bg-green-600 text-white">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white rounded-lg p-6 w-[520px] shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Edit Portfolio</h2>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Summary / Headline" value={summaryInput} onChange={(e) => setSummaryInput(e.target.value)} className="border px-3 py-2 rounded" />
                <input type="text" placeholder="Job Title" value={jobTitleInput} onChange={(e) => setJobTitleInput(e.target.value)} className="border px-3 py-2 rounded" />
                <input type="text" placeholder="Avatar URL" value={avatarInput} onChange={(e) => setAvatarInput(e.target.value)} className="border px-3 py-2 rounded col-span-2" />
                <input type="text" placeholder="Resume URL" value={resumeInput} onChange={(e) => setResumeInput(e.target.value)} className="border px-3 py-2 rounded col-span-2" />
                <input type="text" placeholder="Skills (comma separated)" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="border px-3 py-2 rounded col-span-2" />
                <input type="url" placeholder="LinkedIn URL" value={linkedinInput} onChange={(e) => setLinkedinInput(e.target.value)} className="border px-3 py-2 rounded" />
                <input type="url" placeholder="GitHub URL" value={githubInput} onChange={(e) => setGithubInput(e.target.value)} className="border px-3 py-2 rounded" />
                <textarea placeholder="Bio / About" value={bioInput} onChange={(e)=>setBioInput(e.target.value)} className="border px-3 py-2 rounded col-span-2" />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button onClick={handleUpdatePortfolio} className="px-4 py-2 rounded bg-yellow-500 text-white">Update</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Project Modal (unchanged) */}
        {showProjectModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white rounded-lg p-6 w-[420px] shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Add Project</h2>
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="Title" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="border px-3 py-2 rounded" />
                <textarea placeholder="Description" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} className="border px-3 py-2 rounded" />
                <input type="text" placeholder="Techs (comma separated)" value={projectTechs} onChange={(e) => setProjectTechs(e.target.value)} className="border px-3 py-2 rounded" />
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                  <button onClick={handleCreateProject} className="px-4 py-2 rounded bg-blue-600 text-white">Add</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Dashboard

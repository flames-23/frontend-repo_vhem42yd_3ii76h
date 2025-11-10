import { useState } from 'react'

function Input(props) {
  const { className = '', ...rest } = props
  return <input className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} {...rest} />
}

function Textarea(props) {
  const { className = '', ...rest } = props
  return <textarea className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} {...rest} />
}

export default function App() {
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin: '',
    summary: '',
    job_title_target: '',
    skills: '',
    experience: [ { company: '', role: '', duration: '', achievements: [''] } ],
    education: [ { degree: '', institution: '', year: '' } ],
    certifications: [''],
    projects: [''],
    languages: [''],
    interests: [''],
  })

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const updateNested = (section, index, field, value) => {
    setForm(prev => {
      const copy = { ...prev }
      copy[section] = copy[section].map((item, i) => i === index ? { ...item, [field]: value } : item)
      return copy
    })
  }
  const updateArray = (section, index, value) => {
    setForm(prev => {
      const copy = { ...prev }
      copy[section][index] = value
      return copy
    })
  }
  const addItem = (section, template) => setForm(prev => ({ ...prev, [section]: [...prev[section], template] }))

  const toPayload = () => {
    const skillsArr = form.skills.split(',').map(s => s.trim()).filter(Boolean)
    const clean = arr => (arr || []).map(x => typeof x === 'string' ? x.trim() : x).filter(Boolean)
    return {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      linkedin: form.linkedin || null,
      summary: form.summary || null,
      job_title_target: form.job_title_target,
      skills: skillsArr,
      experience: (form.experience || []).map(e => ({
        company: e.company,
        role: e.role,
        duration: e.duration,
        achievements: clean(e.achievements)
      })),
      education: (form.education || []).map(ed => ({ degree: ed.degree, institution: ed.institution, year: ed.year })),
      certifications: clean(form.certifications),
      projects: clean(form.projects),
      languages: clean(form.languages),
      interests: clean(form.interests),
      template: 'modern'
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${backend}/api/cv/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload())
      })
      if (!res.ok) throw new Error('Failed to generate CV')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = () => {
    if (!result?.pdf_base64) return
    const byteChars = atob(result.pdf_base64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename || 'MakeMeHiredCV.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-gray-900">MakeMeHired<span className="text-blue-600">.com</span></div>
          <div className="text-sm text-gray-600">AI-powered ATS CV Builder</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Enter your details</h2>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input placeholder="Full Name" value={form.full_name} onChange={e=>update('full_name', e.target.value)} required />
              <Input placeholder="Job Title Target" value={form.job_title_target} onChange={e=>update('job_title_target', e.target.value)} required />
              <Input type="email" placeholder="Email" value={form.email} onChange={e=>update('email', e.target.value)} required />
              <Input placeholder="Phone" value={form.phone} onChange={e=>update('phone', e.target.value)} required />
              <Input className="sm:col-span-2" placeholder="LinkedIn URL (optional)" value={form.linkedin} onChange={e=>update('linkedin', e.target.value)} />
            </div>

            <Textarea rows={4} placeholder="Professional Summary (optional)" value={form.summary} onChange={e=>update('summary', e.target.value)} />

            <Input placeholder="Core Skills (comma-separated)" value={form.skills} onChange={e=>update('skills', e.target.value)} />

            <div>
              <div className="text-sm font-medium mb-2">Experience</div>
              {form.experience.map((ex, i) => (
                <div key={i} className="space-y-2 border p-3 rounded mb-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Input placeholder="Company" value={ex.company} onChange={e=>updateNested('experience', i, 'company', e.target.value)} />
                    <Input placeholder="Role" value={ex.role} onChange={e=>updateNested('experience', i, 'role', e.target.value)} />
                    <Input placeholder="Duration" value={ex.duration} onChange={e=>updateNested('experience', i, 'duration', e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1">Achievements</div>
                    {ex.achievements.map((a, j) => (
                      <Input key={j} className="mb-2" placeholder={`Achievement ${j+1}`} value={a} onChange={e=>{
                        const val = e.target.value
                        setForm(prev => { const copy = { ...prev }; copy.experience[i].achievements[j] = val; return copy })
                      }} />
                    ))}
                    <button type="button" className="text-blue-600 text-sm" onClick={()=>{
                      setForm(prev=>{ const copy = { ...prev }; copy.experience[i].achievements.push(''); return copy })
                    }}>+ Add Achievement</button>
                  </div>
                </div>
              ))}
              <button type="button" className="text-blue-600 text-sm" onClick={()=>addItem('experience', { company:'', role:'', duration:'', achievements:[''] })}>+ Add Experience</button>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Education</div>
              {form.education.map((ed, i) => (
                <div key={i} className="grid sm:grid-cols-3 gap-3 mb-3">
                  <Input placeholder="Degree" value={ed.degree} onChange={e=>updateNested('education', i, 'degree', e.target.value)} />
                  <Input placeholder="Institution" value={ed.institution} onChange={e=>updateNested('education', i, 'institution', e.target.value)} />
                  <Input placeholder="Year" value={ed.year} onChange={e=>updateNested('education', i, 'year', e.target.value)} />
                </div>
              ))}
              <button type="button" className="text-blue-600 text-sm" onClick={()=>addItem('education', { degree:'', institution:'', year:'' })}>+ Add Education</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium mb-2">Certifications</div>
                {form.certifications.map((c, i)=> (
                  <Input key={i} className="mb-2" placeholder={`Certification ${i+1}`} value={c} onChange={e=>updateArray('certifications', i, e.target.value)} />
                ))}
                <button type="button" className="text-blue-600 text-sm" onClick={()=>addItem('certifications', '')}>+ Add Certification</button>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Projects / Achievements</div>
                {form.projects.map((p, i)=> (
                  <Input key={i} className="mb-2" placeholder={`Project or Achievement ${i+1}`} value={p} onChange={e=>updateArray('projects', i, e.target.value)} />
                ))}
                <button type="button" className="text-blue-600 text-sm" onClick={()=>addItem('projects', '')}>+ Add Project</button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium mb-2">Languages</div>
                {form.languages.map((l, i)=> (
                  <Input key={i} className="mb-2" placeholder={`Language ${i+1}`} value={l} onChange={e=>updateArray('languages', i, e.target.value)} />
                ))}
                <button type="button" className="text-blue-600 text-sm" onClick={()=>addItem('languages', '')}>+ Add Language</button>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Interests</div>
                {form.interests.map((it, i)=> (
                  <Input key={i} className="mb-2" placeholder={`Interest ${i+1}`} value={it} onChange={e=>updateArray('interests', i, e.target.value)} />
                ))}
                <button type="button" className="text-blue-600 text-sm" onClick={()=>addItem('interests', '')}>+ Add Interest</button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Generating…' : 'Generate CV'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Preview & Download</h2>
            {result?.pdf_base64 && (
              <button onClick={downloadPdf} className="rounded-md bg-green-600 px-3 py-2 text-white text-sm hover:bg-green-700">Download CV</button>
            )}
          </div>
          {!result && (
            <p className="text-sm text-gray-600">Fill the form and click Generate to preview your ATS-ready CV here.</p>
          )}
          {result?.html && (
            <div className="border rounded overflow-hidden">
              <iframe title="cv-preview" className="w-full h-[700px]" srcDoc={result.html}></iframe>
            </div>
          )}
        </section>
      </main>

      <footer className="text-center text-xs text-gray-500 py-6">© {new Date().getFullYear()} MakeMeHired.com — Build recruiter-approved, ATS-friendly CVs.</footer>
    </div>
  )
}

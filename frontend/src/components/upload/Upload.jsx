import { useState } from 'react'
import { uploadReviews } from '../../api'

export default function Upload({ onDone, onCancel }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const steps = [
    { n: '01', title: 'Drop your CSV', desc: 'Choose the file with your customer reviews.' },
    { n: '02', title: 'AI reads everything', desc: 'Sentiment and concerns tagged on every review.' },
    { n: '03', title: 'See what to fix', desc: 'Ranked problems with real customer proof.' },
  ]

  const formats = [
    { k: 'review_text', d: 'the customer review' },
    { k: 'rating', d: '1 to 5 stars' },
    { k: 'date', d: 'review date (optional)' },
  ]

  const acceptFile = (selected) => {
    if (!selected) return

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.')
      setFile(null)
      return
    }

    setFile(selected)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please choose a CSV file first.')
      return
    }

    setBusy(true)
    setError('')

    try {
      await uploadReviews(file)
      onDone()
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Backend se connection nahi ho paya. Baad me try karein.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="upload-page">
      <section className="upload-hero">
        <div className="upload-card">
          <div className="upload-icon">↑</div>
          <div className="eyebrow">DATA IMPORT</div>
          <h1>Upload your reviews</h1>
          <p>Drop your CSV here and get ranked, proven insights in seconds.</p>

          <form onSubmit={handleUpload}>
            <label
              className={`drop-zone${dragging ? ' dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input type="file" accept=".csv" onChange={(e) => acceptFile(e.target.files?.[0])} />

              {file ? (
                <>
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <span className="drop-icon">⇪</span>
                  <strong>Choose CSV file</strong>
                  <span>or drag and drop it here</span>
                </>
              )}
            </label>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="primary-action full-width" disabled={busy}>
              {busy ? 'Analyzing…' : 'Upload & Continue'}
            </button>
          </form>

          <button type="button" className="back-link muted" onClick={onCancel}>
            ← Back to dashboard
          </button>
        </div>
      </section>

      <section className="landing-section how-section">
        <div className="section-heading">
          <div className="landing-badge">WHAT HAPPENS NEXT</div>
          <h2>From file to fix-it list</h2>
        </div>

        <div className="steps-grid">
          {steps.map((s) => (
            <div className="step-card" key={s.n}>
              <span>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section features-section">
        <div className="section-heading">
          <div className="landing-badge">CSV FORMAT</div>
          <h2>Three columns are enough</h2>
        </div>

        <div className="feature-grid">
          {formats.map((f) => (
            <div className="feature-card" key={f.k}>
              <div className="feature-icon">{f.k.slice(0, 2).toUpperCase()}</div>
              <h3>{f.k}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
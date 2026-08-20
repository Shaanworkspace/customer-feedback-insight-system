import { useState } from 'react'
import { uploadReviews } from '../../api'

export default function Upload({ onDone, onCancel }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleFile = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.')
      setFile(null)
      return
    }

    setFile(selected)
    setError('')
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
    <div className="auth-page upload-page">
      <div className="upload-card">
        <div className="upload-icon">↑</div>
        <div className="eyebrow">DATA IMPORT</div>
        <h1>Upload your reviews</h1>
        <p>Choose a CSV file with your customer reviews.</p>

        <form onSubmit={handleUpload}>
          <label className="drop-zone">
            <input type="file" accept=".csv" onChange={handleFile} />
            <strong>{file ? file.name : 'Choose CSV file'}</strong>
            <span>{file ? `${(file.size / 1024).toFixed(1)} KB` : 'CSV files only'}</span>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="primary-action full-width" disabled={busy}>
            {busy ? 'Analyzing…' : 'Upload & Continue'}
          </button>
        </form>

        <div className="upload-format">
          Expected columns: <strong>review_text, rating, date</strong>
        </div>

        <button type="button" className="back-link muted" onClick={onCancel}>
          ← Back to dashboard
        </button>
      </div>
    </div>
  )
}
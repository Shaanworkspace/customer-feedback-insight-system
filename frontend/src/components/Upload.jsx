import { useState } from 'react'

export default function Upload({ onUpload, onBack }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('Please choose a CSV file first.')
      return
    }

    setUploading(true)
    setError('')

    const ok = await onUpload(file)

    if (!ok) {
      setUploading(false)
      setError('Backend se connection nahi ho paya. Baad me try karein.')
    }
  }

  return (
    <div className="upload-page">
      <div className="upload-card">
        <button className="back-link" onClick={onBack}>
          ← Back to home
        </button>

        <div className="upload-icon">↑</div>

        <div className="eyebrow">DATA IMPORT</div>
        <h1>Upload your reviews</h1>
        <p>
          Drop your CSV here or choose a file.
          We will analyze it and show the insights.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            className={`drop-zone${dragging ? ' dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />

            {file ? (
              <>
                <strong>{file.name}</strong>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
              </>
            ) : (
              <>
                <span className="drop-icon">⇪</span>
                <strong>Choose CSV file</strong>
                <span>or drag and drop here</span>
              </>
            )}
          </label>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="primary-action full-width"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload & Continue'}
          </button>
        </form>

        <div className="upload-format">
          Expected columns: <strong>review_text, rating, date</strong>
        </div>
      </div>
    </div>
  )
}
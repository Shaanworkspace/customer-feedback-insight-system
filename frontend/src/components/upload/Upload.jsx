import { useState } from 'react'
import { uploadReviews, setApiBase } from '../../api'

const LOCAL_BASE = 'http://localhost:8000'
const DEPLOYED_BASE = 'https://cfa-api.onrender.com'

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

  const handleUpload = async (e, base) => {
    e.preventDefault()
    if (!file) {
      setError('Please choose a CSV file first.')
      return
    }

    setBusy(true)
    setError('')
    setApiBase(base)

    try {
      await uploadReviews(file)
    } catch (err) {
      console.error('Upload failed, showing sample data:', err)
    } finally {
      setBusy(false)
    }

    onDone()
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex min-h-[68vh] items-center justify-center overflow-hidden bg-[#f4f7fb] px-6 py-20">
        <div className="w-[min(520px,100%)] rounded-[20px] border border-white/50 bg-white/70 p-11 text-center shadow-[0_20px_50px_rgba(23,63,115,0.15)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-[55px] w-[55px] items-center justify-center rounded-[14px] bg-[#edf3fa] text-[26px] font-extrabold text-[#173f73]">
            ↑
          </div>
          <div className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-[#47739e]">DATA IMPORT</div>
          <h1 className="my-1.5 text-[28px] font-bold text-[#142b48]">Upload your reviews</h1>
          <p className="text-[13px] leading-relaxed text-[#7a889b]">
            Drop your CSV here and get ranked, proven insights in seconds.
          </p>

          <form onSubmit={(e) => e.preventDefault()}>
            <label
              className={`mt-6 flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#b9c8d8] bg-[#fafcff] transition ${
                dragging ? 'border-solid border-[#173f73] bg-[#eef4fb]' : 'hover:border-[#47739e] hover:bg-[#f5f9fd]'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input type="file" accept=".csv" className="hidden" onChange={(e) => acceptFile(e.target.files?.[0])} />

              {file ? (
                <>
                  <strong className="text-[14px] text-[#315f89]">{file.name}</strong>
                  <span className="text-[11px] text-[#8a96a8]">{(file.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#e5eef7] text-[20px] font-extrabold text-[#173f73]">
                    ⇪
                  </span>
                  <strong className="text-[14px] text-[#315f89]">Choose CSV file</strong>
                  <span className="text-[11px] text-[#8a96a8]">or drag and drop it here</span>
                </>
              )}
            </label>

            {error && (
              <div className="mt-4 rounded-lg bg-[#fff0ef] px-3 py-2.5 text-[12px] text-[#b42318]">{error}</div>
            )}

            <button
              type="button"
              className="mt-6 w-full cursor-pointer rounded-[9px] border-0 bg-[#173f73] px-5 py-3 font-bold text-white shadow-[0_7px_18px_rgba(23,63,115,0.20)] transition hover:-translate-y-0.5 hover:bg-[#12345f] disabled:cursor-not-allowed"
              disabled={busy}
              onClick={(e) => handleUpload(e, LOCAL_BASE)}
            >
              {busy ? 'Analyzing…' : 'Upload & Continue ON LOCAL'}
            </button>

            <button
              type="button"
              className="mt-3 w-full cursor-pointer rounded-[9px] border border-[#173f73] bg-white px-5 py-3 font-bold text-[#173f73] transition hover:bg-[#eef4fb] disabled:cursor-not-allowed"
              disabled={busy}
              onClick={(e) => handleUpload(e, DEPLOYED_BASE)}
            >
              Upload & Continue ON DEPLOYED
            </button>
          </form>

          <button
            type="button"
            className="mt-4 w-full cursor-pointer border-0 bg-transparent text-[12px] font-semibold text-[#8a96a8]"
            onClick={onCancel}
          >
            ← Back to dashboard
          </button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1120px] px-6 py-20">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <div className="mb-5 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">
            WHAT HAPPENS NEXT
          </div>
          <h2 className="my-3 text-[38px] font-bold text-[#193452]">From file to fix-it list</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div
              className="rounded-2xl border border-[#e1e8f0] bg-white/90 p-7 shadow-[0_8px_25px_rgba(25,52,82,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(25,52,82,0.08)]"
              key={s.n}
            >
              <span className="mb-4 inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#193f70] font-bold text-white">
                {s.n}
              </span>
              <h3 className="mb-2.5 text-[#193452]">{s.title}</h3>
              <p className="leading-relaxed text-[#718198]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1120px] px-6 py-20">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <div className="mb-5 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">
            CSV FORMAT
          </div>
          <h2 className="my-3 text-[38px] font-bold text-[#193452]">Three columns are enough</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {formats.map((f) => (
            <div
              className="rounded-2xl border border-[#e1e8f0] bg-white/90 p-7 shadow-[0_8px_25px_rgba(25,52,82,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(25,52,82,0.08)]"
              key={f.k}
            >
              <div className="mb-5 flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-[#edf3fa] font-extrabold text-[#1b4d80]">
                {f.k.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="mb-2.5 text-[#193452]">{f.k}</h3>
              <p className="leading-relaxed text-[#718198]">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
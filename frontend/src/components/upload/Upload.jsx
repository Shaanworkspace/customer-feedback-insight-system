import { useState, useRef } from 'react'
import { uploadReviews } from '../../api'

// Professional step cards shown below the upload box
const uploadSteps = [
  { stepNumber: '01', title: 'Drop your CSV', description: 'Choose the file that contains your customer reviews.' },
  { stepNumber: '02', title: 'AI reads everything', description: 'Every review is tagged with sentiment and key concerns.' },
  { stepNumber: '03', title: 'See what to fix', description: 'Ranked problems with real customer quotes as proof.' },
]

const expectedColumns = [
  { columnName: 'review_text', columnDetail: 'the customer review — required' },
  { columnName: 'rating / date / country', columnDetail: 'optional, auto-detected if present' },
  { columnName: 'any other column', columnDetail: 'kept and shown in the dashboard' },
]

// Small spinner shown while uploading
function LoadingSpinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
  )
}

// Validate that the file is a CSV
function validateCsvFile(fileToCheck) {
  if (!fileToCheck) {
    return 'Please choose a file first.'
  }
  const fileName = fileToCheck.name.toLowerCase()
  if (!fileName.endsWith('.csv')) {
    return 'Please upload a CSV file (.csv).'
  }
  if (fileToCheck.size === 0) {
    return 'This file is empty. Please choose a valid CSV.'
  }
  return ''
}

export default function Upload({ onStart, onDone, onCancel }) {
  const fileInputReference = useRef(null)
  const [selectedCsvFile, setSelectedCsvFile] = useState(null)
  const [isDraggingOverDropZone, setIsDraggingOverDropZone] = useState(false)
  const [csvUploadErrorMessage, setCsvUploadErrorMessage] = useState('')
  const [isCsvUploadInProgress, setIsCsvUploadInProgress] = useState(false)

  // Called when a file is picked from dialog or dropped
  function handleFileSelection(fileFromInput) {
    console.log('[CFA] [UPLOAD-PAGE] handleFileSelection', fileFromInput ? { name: fileFromInput.name, size: fileFromInput.size } : 'NO FILE')
    const validationError = validateCsvFile(fileFromInput)
    if (validationError) {
      console.error('[CFA] [UPLOAD-PAGE] ❌ validation fail', validationError)
      setCsvUploadErrorMessage(validationError)
      setSelectedCsvFile(null)
      return
    }
    console.log('[CFA] [UPLOAD-PAGE] ✅ file selected, ready to upload')
    setSelectedCsvFile(fileFromInput)
    setCsvUploadErrorMessage('')
  }

  function handleDragOver(event) {
    event.preventDefault()
    setIsDraggingOverDropZone(true)
  }

  function handleDragLeave() {
    setIsDraggingOverDropZone(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDraggingOverDropZone(false)
    const droppedFile = event.dataTransfer.files?.[0]
    handleFileSelection(droppedFile)
  }

  function handleClickDropZone() {
    fileInputReference.current?.click()
  }

  function handleFileInputChange(event) {
    const pickedFile = event.target.files?.[0]
    handleFileSelection(pickedFile)
  }

  // Single upload — ENV decides Local vs Deployed (no two buttons)
  async function uploadToBackend() {
    console.log('[CFA] [UPLOAD-PAGE] uploadToBackend() click — file:', selectedCsvFile ? { name: selectedCsvFile.name, size: selectedCsvFile.size } : 'NO FILE')
    if (!selectedCsvFile) {
      console.error('[CFA] [UPLOAD-PAGE] ❌ no file — upload ruka')
      setCsvUploadErrorMessage('Please choose a CSV file first.')
      return
    }

    const t0 = performance.now()
    console.log('[CFA] [UPLOAD-PAGE] ⏳ upload start — MODEL pe request ja rahi hai…')
    setIsCsvUploadInProgress(true)
    setCsvUploadErrorMessage('')

    try {
      const result = await uploadReviews(selectedCsvFile)
      const dt = Math.round(performance.now() - t0)
      console.log(`[CFA] [UPLOAD-PAGE] ✅ MODEL se response aa gaya in ${dt}ms`, { total: result.total_reviews })
      if (dt > 15000) console.warn('[CFA] [UPLOAD-PAGE] ⚠️ 15s+ laga — MODEL fang gaya lagta hai (backend cold start?)')
      onStart?.()
      onDone()
    } catch (uploadError) {
      const dt = Math.round(performance.now() - t0)
      console.error(`[CFA] [UPLOAD-PAGE] ❌ fail in ${dt}ms — file gayi ya nahi?`, uploadError.message)
      if (uploadError.message?.toLowerCase().includes('network') || uploadError.message?.toLowerCase().includes('backend')) {
        console.error('[CFA] [UPLOAD-PAGE] → file backend tak gayi hi nahi')
        setCsvUploadErrorMessage('Cannot reach the server. Please check if the backend is running and try again.')
      } else {
        console.error('[CFA] [UPLOAD-PAGE] → file gayi, MODEL pe error aaya')
        setCsvUploadErrorMessage(uploadError?.message || 'Upload failed. Please try again with a valid CSV.')
      }
    } finally {
      setIsCsvUploadInProgress(false)
      console.log('[CFA] [UPLOAD-PAGE] uploadToBackend done')
    }
  }

  const formattedFileSize = selectedCsvFile ? `${(selectedCsvFile.size / 1024).toFixed(1)} KB` : ''

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero upload card */}
      <section className="relative flex min-h-[68vh] items-center justify-center overflow-hidden bg-[#f4f7fb] px-6 py-20">
        <div className="hero-bg" aria-hidden="true" />
        <div className="relative z-[1] w-[min(560px,100%)] rounded-[20px] border border-white/50 bg-white/80 p-10 text-center shadow-[0_20px_50px_rgba(23,63,115,0.15)] backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-[14px] bg-[#edf3fa] text-[26px] font-extrabold text-[#173f73]">↑</div>
          <div className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-[#47739e]">DATA IMPORT</div>
          <h1 className="my-1 text-[28px] font-bold tracking-tight text-[#142b48]">Upload your reviews</h1>
          <p className="mx-auto max-w-[420px] text-[13px] leading-relaxed text-[#7a889b]">
            Drop your CSV here and get ranked, proven insights in seconds. Any column layout works — we find the review text by itself.
          </p>

          {/* Drag and drop zone — professional div, not a plain button */}
          <div
            role="button"
            tabIndex={0}
            aria-label="CSV drop zone, click to choose file or drag and drop"
            onClick={handleClickDropZone}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClickDropZone()
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-6 flex min-h-[170px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-[#fafcff] px-6 py-8 transition
              ${isDraggingOverDropZone ? 'border-solid border-[#173f73] bg-[#eef4fb] shadow-[0_4px_16px_rgba(23,63,115,0.08)]' : 'border-[#b9c8d8] hover:border-[#47739e] hover:bg-[#f5f9fd]'}
              ${isCsvUploadInProgress ? 'pointer-events-none opacity-70' : 'cursor-pointer'}`}
          >
            {/* Hidden file input, opened via div click */}
            <input
              ref={fileInputReference}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInputChange}
              aria-hidden="true"
              tabIndex={-1}
            />

            {selectedCsvFile ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#173f73]">✓</div>
                <strong className="max-w-full truncate text-[14px] text-[#315f89]">{selectedCsvFile.name}</strong>
                <span className="text-[11px] font-medium text-[#8a96a8]">{formattedFileSize} · Ready to upload</span>
                <span className="text-[11px] text-[#47739e]">Click to choose a different file or drag a new one</span>
              </>
            ) : (
              <>
                <span className="flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-[#e5eef7] text-[22px] font-extrabold text-[#173f73]">⇪</span>
                <strong className="text-[14px] text-[#315f89]">Choose CSV file</strong>
                <span className="text-[11px] text-[#8a96a8]">or drag and drop it here</span>
                <span className="mt-1 rounded-full bg-[#edf3fa] px-3 py-1 text-[10px] font-bold tracking-wide text-[#315f89]">Only .CSV files</span>
              </>
            )}
          </div>

          {/* Error message */}
          {csvUploadErrorMessage && (
            <div role="alert" className="mt-4 rounded-lg border border-[#ffd5ce] bg-[#fff0ef] px-3 py-2.5 text-left text-[12px] font-medium text-[#b42318]">
              {csvUploadErrorMessage}
            </div>
          )}

          {/* Single action button — ENV decides where it goes */}
          <button
            type="button"
            disabled={isCsvUploadInProgress}
            onClick={uploadToBackend}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-[#173f73] px-5 py-3.5 text-[14px] font-bold text-white shadow-[0_7px_18px_rgba(23,63,115,0.20)] transition hover:-translate-y-0.5 hover:bg-[#12345f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCsvUploadInProgress && <LoadingSpinner />}
            {isCsvUploadInProgress ? 'Analyzing your reviews…' : 'Upload & Analyze'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isCsvUploadInProgress}
            className="mt-4 w-full border-0 bg-transparent text-[12px] font-semibold text-[#8a96a8] transition hover:text-[#5a6472] disabled:opacity-50"
          >
            ← Back to dashboard
          </button>

          <p className="mt-3 text-[10px] leading-relaxed text-[#8a96a8]">Your CSV is analyzed securely and used only to build your dashboard.</p>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto w-full max-w-[1120px] px-6 py-16">
        <div className="mx-auto mb-10 max-w-[700px] text-center">
          <div className="mb-4 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">WHAT HAPPENS NEXT</div>
          <h2 className="my-2 text-[32px] font-bold tracking-tight text-[#193452]">From file to fix-it list</h2>
          <p className="text-[13px] text-[#718198]">Three clear steps, no manual tagging needed.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {uploadSteps.map((currentStep) => (
            <div
              key={currentStep.stepNumber}
              className="rounded-2xl border border-[#e1e8f0] bg-white/90 p-7 shadow-[0_8px_25px_rgba(25,52,82,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(25,52,82,0.08)]"
            >
              <span className="mb-4 inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#193f70] text-[13px] font-extrabold text-white">{currentStep.stepNumber}</span>
              <h3 className="mb-2 text-[15px] font-bold text-[#193452]">{currentStep.title}</h3>
              <p className="text-[13px] leading-relaxed text-[#718198]">{currentStep.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Format */}
      <section className="mx-auto w-full max-w-[1120px] px-6 pb-20">
        <div className="mx-auto mb-10 max-w-[700px] text-center">
          <div className="mb-4 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">CSV FORMAT</div>
          <h2 className="my-2 text-[32px] font-bold tracking-tight text-[#193452]">Any columns work</h2>
          <p className="text-[13px] text-[#718198]">We find the review text by itself and keep everything else for your dashboard.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {expectedColumns.map((columnInfo) => (
            <div
              key={columnInfo.columnName}
              className="rounded-2xl border border-[#e1e8f0] bg-white/90 p-7 shadow-[0_8px_25px_rgba(25,52,82,0.05)]"
            >
              <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-[#edf3fa] text-[12px] font-extrabold text-[#1b4d80]">
                {columnInfo.columnName.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="mb-1.5 text-[14px] font-bold text-[#193452]">{columnInfo.columnName}</h3>
              <p className="text-[13px] leading-relaxed text-[#718198]">{columnInfo.columnDetail}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

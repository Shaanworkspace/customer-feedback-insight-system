import { useEffect, useState, useRef } from 'react'
import {
  getHistory,
  getHistoryReport,
  getConcernComments,
  getMe,
  getUser,
  sendReportEmail,
  uploadReviews,
} from '../api'
import { downloadText, sampleCsvText, reportToCsv } from '../utils'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

const COLORS = ['#173f73', '#e05252', '#b8860b', '#25834c', '#8a5a92', '#3d7ea6', '#c9733d', '#5d6d7e']

const SENT_CLASS = {
  positive: 'bg-[#eaf8f0] text-[#1f7c46]',
  negative: 'bg-[#fff0ef] text-[#b83b34]',
  mixed: 'bg-[#fff7e6] text-[#b7791f]',
  neutral: 'bg-[#eef1f6] text-[#5a6472]',
}

const SENT_COLOR = {
  Positive: '#25834c',
  Negative: '#c94a3d',
  Neutral: '#8a96a8',
  Mixed: '#b7791f',
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-[14px] bg-[#e6ecf3] ${className}`} />
}

export default function Dashboard({ analyzing = false, reloadKey = 0, onUpload, onReload }) {
  const [me, setMe] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [listError, setListError] = useState(false)
  const [selectedId, setSelectedId] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('analysis')
    return p ? Number(p) : null
  })
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [openConcern, setOpenConcern] = useState(null)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentError, setCommentError] = useState(false)

  // For Top 5 + See more and Review Explorer (55) + See more
  const [visibleConcernCount, setVisibleConcernCount] = useState(5)
  const [reviewVisibleCount, setReviewVisibleCount] = useState(10)
  const [activeTab, setActiveTab] = useState('all')
  const [isBoardOpen, setIsBoardOpen] = useState(false)
  const [boardReviews, setBoardReviews] = useState([])

  // Drag and drop on dashboard
  const dashboardFileInputRef = useRef(null)
  const [dashboardIsDragging, setDashboardIsDragging] = useState(false)
  const [dashboardUploadError, setDashboardUploadError] = useState('')
  const [dashboardIsUploading, setDashboardIsUploading] = useState(false)

  function validateCsvFile(fileToCheck) {
    if (!fileToCheck) return 'Please choose a file.'
    if (!fileToCheck.name.toLowerCase().endsWith('.csv')) return 'Please upload a CSV file.'
    if (fileToCheck.size === 0) return 'This file is empty.'
    return ''
  }

  function handleDashboardFile(fileToHandle) {
    const validationError = validateCsvFile(fileToHandle)
    if (validationError) {
      setDashboardUploadError(validationError)
      return
    }
    setDashboardUploadError('')
    handleDashboardUpload(fileToHandle)
  }

  async function handleDashboardUpload(fileToUpload) {
    setDashboardIsUploading(true)
    setDashboardUploadError('')
    try {
      await uploadReviews(fileToUpload)
      if (onReload) onReload()
      else window.location.reload()
    } catch (uploadError) {
      setDashboardUploadError(uploadError.message || 'Upload failed. Please try again.')
    } finally {
      setDashboardIsUploading(false)
    }
  }

  const selectAnalysis = (id) => {
    setSelectedId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'dashboard')
    url.searchParams.set('analysis', String(id))
    window.history.pushState({ view: 'dashboard' }, '', url.toString())
  }

  const backToList = () => {
    setSelectedId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('analysis')
    window.history.pushState({ view: 'dashboard' }, '', url.toString())
  }

  useEffect(() => {
    const u = getUser()
    if (u) setMe(u)
    else getMe().then(setMe).catch(() => setMe(null))
    getHistory().then(setAnalyses).catch(() => setListError(true))
  }, [reloadKey])

  useEffect(() => {
    if (selectedId == null) {
      setStats(null)
      setReviews([])
      return
    }
    setViewLoading(true)
    setViewError(false)
    setStatus('')
    getHistoryReport(selectedId)
      .then((r) => {
        setStats(r)
        setReviews(r.reviews || [])
      })
      .catch(() => setViewError(true))
      .finally(() => setViewLoading(false))
  }, [selectedId])

  const openComments = (concern) => {
    setOpenConcern(concern)
    setLoadingComments(true)
    setCommentError(false)
    setComments([])
    getConcernComments(concern)
      .then((c) => setComments(c))
      .catch(() => setCommentError(true))
      .finally(() => setLoadingComments(false))
  }

  // Open board for a tab and also filter the two lists above
  function openTabBoard(tabName) {
    setActiveTab(tabName)
    setVisibleConcernCount(5)
    setReviewVisibleCount(10)
    setIsBoardOpen(true)
    let filtered = []
    if (tabName === 'top') {
      filtered = reviews.filter((r) => {
        const topNames = concerns.slice(0, 3).map((c) => c.concern)
        return r.concerns?.some((c) => topNames.includes(c.name))
      })
    } else if (tabName === 'positive' || tabName === 'negative' || tabName === 'neutral' || tabName === 'mixed') {
      filtered = reviews.filter((r) => r.sentiment === tabName)
    } else if (tabName === 'all' || tabName === 'review') {
      filtered = reviews
    }
    setBoardReviews(filtered.slice(0, 55))
  }

  const send = () => {
    if (!email) {
      setStatus('Enter an email address first.')
      return
    }
    if (selectedId == null) return
    setStatus('Sending…')
    sendReportEmail(email, selectedId)
      .then(() => setStatus(`Report sent to ${email}`))
      .catch((e) => setStatus(e.message || 'Failed to send'))
  }

  if (analyzing) {
    return (
      <div className="w-full">
        <Skeleton className="mb-8 h-[60px]" />
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[110px]" />)}
        </div>
        <Skeleton className="mb-5 h-[240px]" />
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (selectedId == null) {
    return (
      <div className="w-full">
        {/* Full page background like login — covers entire dashboard */}
        <div className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80')" }} aria-hidden="true" />
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#f4f7fb]/90 via-[#f4f7fb]/70 to-[#f4f7fb]/95" aria-hidden="true" />

        {/* Hero — light blue, professional, on main page */}
        <section className="relative mb-8 overflow-hidden rounded-[20px] border border-white/60 bg-gradient-to-br from-[#eaf1f8] via-[#f0f6ff] to-white p-8 shadow-[0_20px_50px_rgba(23,63,115,0.10)] md:p-10">
          <div className="mx-auto max-w-[820px] text-center">
            <div className="mx-auto mb-3 inline-block rounded-full bg-[#173f73] px-3 py-1 text-[10px] font-extrabold tracking-[1.5px] text-white">WELCOME TO YOUR WORKSPACE</div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-extrabold leading-tight tracking-tight text-[#142b48]">Hi {me?.first_name || 'there'} 👋</h2>
            <p className="mx-auto mt-3 max-w-[640px] text-[15px] leading-relaxed text-[#5a6d80]">
              Your customer feedback, turned into clear actions. Drop your CSV and see <strong className="font-extrabold text-[#173f73]">what customers love, what hurts, and what to fix first</strong> — with real quotes as proof.
            </p>
            <div className="mx-auto mt-6 max-w-[560px]">
              <div
                role="button"
                tabIndex={0}
                aria-label="Drop CSV here to upload"
                onClick={() => dashboardFileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') dashboardFileInputRef.current?.click()
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDashboardIsDragging(true)
                }}
                onDragLeave={() => setDashboardIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDashboardIsDragging(false)
                  handleDashboardFile(e.dataTransfer.files?.[0])
                }}
                className={`flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed bg-white px-6 py-7 text-center shadow-[0_8px_25px_rgba(23,63,115,0.08)] transition
                  ${dashboardIsDragging ? 'border-solid border-[#173f73] bg-[#eef4fb]' : 'border-[#b9c8d8] hover:border-[#173f73] hover:bg-[#f5f9fd]'}
                  ${dashboardIsUploading ? 'pointer-events-none opacity-70' : 'cursor-pointer'}`}
              >
                <input ref={dashboardFileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleDashboardFile(e.target.files?.[0])} />
                {dashboardIsUploading ? (
                  <>
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#173f73] border-t-transparent" aria-hidden="true" />
                    <strong className="text-[14px] text-[#173f73]">Analyzing your reviews…</strong>
                    <span className="text-[11px] text-[#8a96a8]">This takes a few seconds</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3fa] text-[20px] font-extrabold text-[#173f73]">⇪</span>
                    <strong className="text-[14px] text-[#142b48]">Drop CSV here</strong>
                    <span className="text-[11px] text-[#8a96a8]">or click to choose a file — any columns work</span>
                  </>
                )}
              </div>
              {dashboardUploadError && (
                <div role="alert" className="mt-3 rounded-lg border border-[#ffd5ce] bg-[#fff0ef] px-3 py-2.5 text-left text-[12px] font-medium text-[#b42318]">
                  {dashboardUploadError}
                </div>
              )}
              <p className="mt-3 text-[10px] text-[#8a96a8]">Only <code className="rounded bg-[#f0f4f8] px-1 py-0.5">review_text</code> is required. Add <code className="rounded bg-[#f0f4f8] px-1 py-0.5">rating, date, country</code> for richer charts.</p>
            </div>
          </div>
        </section>

        {/* Your analyses — just below hero, as requested (second) */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[20px] font-bold text-[#142b48]">Your analyses</h3>
            <span className="text-[12px] text-[#8793a5]">{analyses.length} saved</span>
          </div>
          {listError ? (
            <div className="rounded-[14px] border border-[#ffd5ce] bg-[#fff5f3] p-6 text-center text-[13px] text-[#b42318]">Could not load your analyses.</div>
          ) : analyses.length === 0 ? (
            <div className="rounded-[15px] border border-dashed border-[#cdd8e4] bg-white p-10 text-center">
              <p className="text-[14px] font-semibold text-[#718097]">No analyses yet.</p>
              <p className="mt-1 text-[13px] text-[#8a96a8]">Upload a CSV above to get your first report.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {analyses.map((a) => (
                <div
                  key={a.id}
                  className="group relative rounded-[15px] border border-[#e1e7ef] bg-white p-5 shadow-[0_4px_18px_rgba(25,46,72,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(25,46,72,0.08)]"
                >
                  <button type="button" onClick={() => selectAnalysis(a.id)} className="w-full cursor-pointer text-left">
                    <strong className="block truncate pr-6 text-[15px] text-[#142b48]">{a.filename || 'Untitled analysis'}</strong>
                    <div className="mt-1 text-[12px] text-[#8793a5]">
                      {a.total_reviews != null ? `${a.total_reviews} reviews · ` : ''}
                      {a.created_at ? `${new Date(a.created_at).toLocaleDateString()} ${new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(a.top_concerns || []).map((c, i) => (
                        <span key={i} className="rounded-md bg-[#f0f4f8] px-2 py-0.5 text-[10px] font-bold capitalize text-[#536a82]">{c}</span>
                      ))}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete analysis"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!confirm(`Delete "${a.filename || 'this analysis'}"?`)) return
                      try {
                        const { deleteHistory } = await import('../api')
                        await deleteHistory(a.id)
                        setAnalyses((prev) => prev.filter((item) => item.id !== a.id))
                        if (selectedId === a.id) {
                          setSelectedId(null)
                          setStats(null)
                        }
                      } catch (err) {
                        alert(err.message || 'Could not delete')
                      }
                    }}
                    className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white p-0 text-[14px] font-bold text-[#8a96a8] shadow transition hover:bg-[#fff0ef] hover:text-[#b42318] group-hover:flex"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How your data should look — premium table with corner symbol and bigger headings */}
        <section className="relative mb-12 overflow-hidden rounded-[20px] border border-[#e1e7ef] bg-white p-8 shadow-[0_8px_25px_rgba(25,46,72,0.06)]">
          <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#173f73] text-white shadow" aria-hidden="true">▦</div>
          <div className="mb-5 flex items-center justify-between pr-8">
            <h3 className="text-[20px] font-extrabold tracking-tight text-[#142b48]">How your data should look</h3>
            <span className="rounded-full bg-[#eaf1f8] px-3 py-1 text-[10px] font-extrabold tracking-wide text-[#315f89]">1 column required</span>
          </div>
          <p className="mb-5 text-[13px] leading-relaxed text-[#5a6d80]">Column names are flexible — we find <code className="rounded bg-[#f0f4f8] px-1 py-0.5">review_text</code> even if you call it <code className="rounded bg-[#f0f4f8] px-1 py-0.5">Review Text, comment, feedback</code>. Extra columns are kept and shown. Here is a good example:</p>
          <div className="overflow-hidden rounded-xl border border-[#e1e7ef]">
            <div className="grid grid-cols-[1.4fr_0.6fr_0.7fr_0.6fr] gap-px bg-[#e1e7ef] text-[11px] font-extrabold uppercase tracking-wide text-[#5a6472]">
              <div className="bg-[#f8fafc] px-4 py-3">review_text <span className="ml-1 rounded bg-[#173f73] px-1.5 py-0.5 text-[9px] text-white">required</span></div>
              <div className="bg-[#f8fafc] px-4 py-3">rating</div>
              <div className="bg-[#f8fafc] px-4 py-3">date</div>
              <div className="bg-[#f8fafc] px-4 py-3">country</div>
            </div>
            <div className="grid grid-cols-[1.4fr_0.6fr_0.7fr_0.6fr] gap-px bg-[#e1e7ef] text-[12px]">
              <div className="bg-white px-4 py-2.5 text-[#33425a]">Battery drains fast and overheats.</div>
              <div className="bg-white px-4 py-2.5 text-center text-[#33425a]">1</div>
              <div className="bg-white px-4 py-2.5 text-[#33425a]">2024-01-08</div>
              <div className="bg-white px-4 py-2.5 text-[#33425a]">India</div>
            </div>
            <div className="grid grid-cols-[1.4fr_0.6fr_0.7fr_0.6fr] gap-px bg-[#e1e7ef] text-[12px]">
              <div className="bg-white px-4 py-2.5 text-[#33425a]">Camera is stunning, love it.</div>
              <div className="bg-white px-4 py-2.5 text-center text-[#33425a]">5</div>
              <div className="bg-white px-4 py-2.5 text-[#33425a]">2024-01-10</div>
              <div className="bg-white px-4 py-2.5 text-[#33425a]">USA</div>
            </div>
            <div className="grid grid-cols-[1.4fr_0.6fr_0.7fr_0.6fr] gap-px bg-[#e1e7ef] text-[12px]">
              <div className="bg-white px-4 py-2.5 italic text-[#8a96a8]">The chair armrest is wobbly but fabric is comfortable.</div>
              <div className="bg-white px-4 py-2.5 text-center text-[#33425a]">3</div>
              <div className="bg-white px-4 py-2.5 text-[#33425a]">2024-02-15</div>
              <div className="bg-white px-4 py-2.5 text-[#33425a]">Germany</div>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[#8a96a8]">Tip: You can also give just one column — <code className="rounded bg-[#f0f4f8] px-1 py-0.5">review_text</code> — and the main insights will still work. Extra columns just make the extra charts.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => downloadText('sample_reviews.csv', sampleCsvText())}
              className="inline-flex items-center gap-2 rounded-full bg-[#173f73] px-5 py-2.5 text-[12px] font-extrabold text-white shadow transition hover:bg-[#12345f]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[12px]">⤓</span>
              Download sample CSV — see ideal format
            </button>
            <span className="self-center text-[11px] text-[#8a96a8]">3 rows: battery, camera, chair — perfect to try</span>
          </div>
        </section>

        {/* Four sections — premium, bigger, no counting, professional */}
        <section className="mb-12">
          <div className="mb-8 text-center">
            <h3 className="text-[26px] font-extrabold tracking-tight text-[#142b48]">How it all works — and stays safe</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#718198]">Four clear sections, each with a large visual and well-spaced layout.</p>
          </div>
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-1 items-center gap-10 rounded-[20px] border border-[#e1e7ef] bg-white p-10 shadow-[0_8px_25px_rgba(25,46,72,0.06)] md:grid-cols-[1.2fr_1fr]">
              <div className="order-2 md:order-1">
                <h4 className="text-[20px] font-extrabold tracking-tight text-[#142b48]">How your data is</h4>
                <p className="mt-3 text-[14px] leading-relaxed text-[#5a6d80]">Your CSV stays as is. We read <code className="rounded bg-[#f0f4f8] px-1 py-0.5">review_text</code> and auto-keep every other column in <code className="rounded bg-[#f0f4f8] px-1 py-0.5">attributes</code> — nothing is deleted or reshaped. What you see in the table above is exactly what we store.</p>
              </div>
              <div className="order-1 overflow-hidden rounded-xl md:order-2">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" alt="Data table" className="h-[260px] w-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="grid grid-cols-1 items-center gap-10 rounded-[20px] border border-[#e1e7ef] bg-white p-10 shadow-[0_8px_25px_rgba(25,46,72,0.06)] md:grid-cols-[1fr_1.2fr]">
              <div className="overflow-hidden rounded-xl">
                <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80" alt="AI working" className="h-[260px] w-full object-cover" loading="lazy" />
              </div>
              <div>
                <h4 className="text-[20px] font-extrabold tracking-tight text-[#142b48]">How we are working</h4>
                <p className="mt-3 text-[14px] leading-relaxed text-[#5a6d80]">We work in sequence: <strong>read → clean → BERT (5 labels) → per-aspect feeling → overall Mixed</strong>. BERT finds aspects by pattern <code className="rounded bg-[#f0f4f8] px-1 py-0.5">X is wobbly</code> → X is aspect, so any product (chair, phone, watch) works without a new list.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 items-center gap-10 rounded-[20px] border border-[#e1e7ef] bg-white p-10 shadow-[0_8px_25px_rgba(25,46,72,0.06)] md:grid-cols-[1.2fr_1fr]">
              <div>
                <h4 className="text-[20px] font-extrabold tracking-tight text-[#142b48]">How we should improve it</h4>
                <p className="mt-3 text-[14px] leading-relaxed text-[#5a6d80]">We rank by <code className="rounded bg-[#f0f4f8] px-1 py-0.5">count × negative%</code>. Fix the top — battery 8× 87% — and the whole feeling lifts. The dashboard shows impact 100 on top, so you know where to act first.</p>
              </div>
              <div className="overflow-hidden rounded-xl">
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" alt="Improve chart" className="h-[260px] w-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="grid grid-cols-1 items-center gap-10 rounded-[20px] border border-[#e1e7ef] bg-white p-10 shadow-[0_8px_25px_rgba(25,46,72,0.06)] md:grid-cols-[1fr_1.2fr]">
              <div className="overflow-hidden rounded-xl">
                <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80" alt="Privacy lock" className="h-[260px] w-full object-cover" loading="lazy" />
              </div>
              <div>
                <h4 className="text-[20px] font-extrabold tracking-tight text-[#142b48]">How we maintain privacy</h4>
                <p className="mt-3 text-[14px] leading-relaxed text-[#5a6d80]">Per-user, last 3 analyses only. MySQL on Aiven (online) or local SQLite. Your CSV is analyzed securely and never shared. Delete any analysis with the × on hover.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (viewLoading) {
    return (
      <div className="w-full">
        <Skeleton className="mb-8 h-[60px]" />
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[110px]" />)}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (viewError || !stats) {
    return (
      <div className="w-full">
        <button type="button" className="mb-4 text-[13px] font-semibold text-[#173f73]" onClick={backToList}>
          ← Back to analyses
        </button>
        <div className="rounded-[14px] border border-[#ffd5ce] bg-[#fff5f3] p-8 text-center text-[13px] text-[#b42318]">
          Could not load this analysis.
        </div>
      </div>
    )
  }

  const total = stats.total_reviews || 0
  const sd = stats.sentiment_distribution || {}
  const pos = sd.positive || 0
  const neg = sd.negative || 0
  const neu = sd.neutral || 0
  const mix = sd.mixed || 0
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)
  const concerns = stats.ranked_concerns || []
  const proof = stats.proof_by_concern || {}
  const topConcern = concerns[0]

  const sentimentData = [
    { name: 'Positive', value: pos },
    { name: 'Negative', value: neg },
    { name: 'Neutral', value: neu },
    { name: 'Mixed', value: mix },
  ].filter((d) => d.value > 0)
  const concernData = concerns.map((c) => ({ name: c.concern, count: c.count }))

  const totalMentions = concerns.reduce((a, c) => a + c.count, 0)
  const concernSummary = concerns.map((c) => ({
    ...c,
    share: totalMentions ? Math.round((c.count / totalMentions) * 100) : 0,
    positive: Math.round(c.count * (1 - c.negative_pct / 100)),
  }))

  // Filter for tabs — both Priority Concerns and Review Explorer
  const filteredConcernSummary = concernSummary.filter((c) => {
    if (activeTab === 'all' || activeTab === 'review') return true
    if (activeTab === 'top') return c.priority <= 3
    if (activeTab === 'positive') return c.negative_pct < 30
    if (activeTab === 'negative') return c.negative_pct >= 70
    if (activeTab === 'neutral') return c.negative_pct >= 30 && c.negative_pct < 70
    if (activeTab === 'mixed') return c.negative_pct >= 30 && c.negative_pct < 70
    return true
  })

  const filteredReviewsForExplorer = reviews.filter((r) => {
    if (activeTab === 'all' || activeTab === 'top' || activeTab === 'review') return true
    return r.sentiment === activeTab
  })

  const ratingData = Object.entries(stats.ratings || {})
    .map(([star, count]) => ({ star: Number(star), count }))
    .sort((a, b) => a.star - b.star)
  const timeData = stats.time_trend || []
  const countryData = Object.entries(stats.countries || {})
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return (
    <div className="w-full">
      <section className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <button type="button" className="mb-2 text-[13px] font-semibold text-[#173f73]" onClick={backToList}>
            ← Back to analyses
          </button>
          <div className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-[#47739e]">CUSTOMER INTELLIGENCE</div>
          <h2 className="m-0 text-[clamp(26px,3.5vw,36px)] font-bold tracking-tight text-[#142b48]">
            {total.toLocaleString()} reviews analyzed
          </h2>
          <p className="mt-2 text-[15px] text-[#718097]">{concerns.length} priority issues found</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#173f73] px-5 py-3 text-[13px] font-extrabold tracking-wide text-white shadow-[0_7px_18px_rgba(23,63,115,0.20)] transition hover:-translate-y-0.5 hover:bg-[#12345f] hover:shadow-[0_10px_24px_rgba(23,63,115,0.25)]"
            onClick={onUpload}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[12px]">＋</span>
            Upload new
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#173f73] bg-white px-5 py-3 text-[13px] font-extrabold tracking-wide text-[#173f73] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eef4fb] hover:shadow"
            onClick={() => downloadText('report.csv', reportToCsv(stats))}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#edf3fa] text-[12px]">⤓</span>
            Export CSV
          </button>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-[14px] border border-[#e1e7ef] bg-white p-5 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <div className="text-[13px] font-semibold text-[#718097]">Total Reviews</div>
          <strong className="mt-3 block text-[29px] font-bold tracking-tight text-[#142b48]">{total.toLocaleString()}</strong>
          <div className="mt-2 text-[11px] font-semibold text-[#173f73]">Dataset analyzed</div>
        </div>
        <div className="rounded-[14px] border border-[#e1e7ef] bg-white p-5 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <div className="text-[13px] font-semibold text-[#718097]">Positive</div>
          <strong className="mt-3 block text-[29px] font-bold tracking-tight text-[#1f7c46]">{pos.toLocaleString()}</strong>
          <div className="mt-2 text-[11px] font-semibold text-[#25834c]">{pct(pos)}% of all reviews</div>
        </div>
        <div className="rounded-[14px] border border-[#e1e7ef] bg-white p-5 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <div className="text-[13px] font-semibold text-[#718097]">Negative</div>
          <strong className="mt-3 block text-[29px] font-bold tracking-tight text-[#c94a3d]">{neg.toLocaleString()}</strong>
          <div className="mt-2 text-[11px] font-semibold text-[#c94a3d]">{pct(neg)}% of all reviews</div>
        </div>
        <div className="rounded-[14px] border border-[#e1e7ef] bg-white p-5 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <div className="text-[13px] font-semibold text-[#718097]">Neutral</div>
          <strong className="mt-3 block text-[29px] font-bold tracking-tight text-[#5a6472]">{neu.toLocaleString()}</strong>
          <div className="mt-2 text-[11px] font-semibold text-[#5a6472]">{pct(neu)}% of all reviews</div>
        </div>
        <div className="rounded-[14px] border border-[#e1e7ef] bg-white p-5 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <div className="text-[13px] font-semibold text-[#718097]">Mixed</div>
          <strong className="mt-3 block text-[29px] font-bold tracking-tight text-[#b7791f]">{mix.toLocaleString()}</strong>
          <div className="mt-2 text-[11px] font-semibold text-[#b7791f]">{pct(mix)}% of all reviews</div>
        </div>
        <div className="rounded-[14px] border border-[#e1e7ef] bg-white p-5 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <div className="text-[13px] font-semibold text-[#718097]">Priority Issues</div>
          <strong className="mt-3 block text-[29px] font-bold tracking-tight text-[#142b48]">{concerns.length}</strong>
          <div className="mt-2 text-[11px] font-semibold text-[#b8860b]">Concerns detected</div>
        </div>
      </section>

      {topConcern && (
        <section className="mb-5 rounded-[15px] border border-[#fde2de] bg-gradient-to-r from-[#fff6f4] to-white p-6">
          <div className="text-[11px] font-extrabold tracking-[1.5px] text-[#c94a3d]">ACT FIRST — TOP PRIORITY</div>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <strong className="text-[clamp(20px,3vw,28px)] capitalize text-[#142b48]">{topConcern.concern}</strong>
            <span className="text-[14px] text-[#718097]">
              {topConcern.count.toLocaleString()} mentions · {topConcern.negative_pct}% negative · impact {topConcern.impact}
            </span>
          </div>
          {proof[topConcern.concern]?.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {proof[topConcern.concern].slice(0, 3).map((p, i) => (
                <blockquote key={i} className="rounded-lg border-l-4 border-[#c94a3d] bg-white px-4 py-2 text-[13px] italic text-[#4a5b6e]">
                  "{p.text}" <span className="text-[10px] not-italic text-[#8a96a8]">({Math.round(p.similarity * 100)}% similar)</span>
                </blockquote>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Sentiment Distribution</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Overall customer sentiment</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {sentimentData.map((d) => <Cell key={d.name} fill={SENT_COLOR[d.name]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Concern Mentions</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">How often each concern appears</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={concernData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {concernData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Priority Concerns</h3>
            <p className="mt-1 text-[12px] text-[#8793a5]">Issues to fix first, ranked by impact — top 10 shown</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'top', label: 'Top' },
              { key: 'positive', label: 'Positive' },
              { key: 'negative', label: 'Negative' },
              { key: 'neutral', label: 'Neutral' },
              { key: 'mixed', label: 'Mixed' },
              { key: 'review', label: 'Review' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => openTabBoard(tab.key)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition ${
                  activeTab === tab.key ? 'bg-[#173f73] text-white shadow' : 'bg-[#f0f4f8] text-[#536a82] hover:bg-[#e1eaf5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-5">
          {filteredConcernSummary.length === 0 ? (
            <p className="rounded-lg bg-[#f8fafc] p-4 text-center text-[13px] text-[#8a96a8]">No concerns for “{activeTab}”.</p>
          ) : (
            filteredConcernSummary.slice(0, visibleConcernCount).map((c, index) => (
              <div className="grid grid-cols-[32px_1fr_110px_auto] items-center gap-3" key={c.concern}>
                <div className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[12px] font-extrabold ${index === 0 ? 'bg-[#fdeceb] text-[#c94a3d]' : 'bg-[#edf3fa] text-[#173f73]'}`}>
                  {index + 1}
                </div>
                <div>
                  <div className="mb-2 flex justify-between">
                    <strong className="text-[13px] capitalize">{c.concern}</strong>
                    <span className="text-[10px] text-[#8a96a8]">
                      {c.count.toLocaleString()} mentions · {c.share}% share · {c.positive} positive
                    </span>
                  </div>
                  <div className={`h-[8px] w-full overflow-hidden rounded-full bg-[#eef1f6]`}>
                    <div className={`h-full ${index === 0 ? 'bg-[#c94a3d]' : 'bg-[#173f73]'} rounded-full`} style={{ width: `${c.share}%` }} />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#8a96a8]">{c.negative_pct}%</div>
                <button
                  type="button"
                  className="rounded-[9px] border border-[#173f73]/40 px-3 py-1.5 text-[11px] font-bold text-[#173f73] transition hover:bg-[#eef4fb]"
                  onClick={() => openComments(c.concern)}
                >
                  View comments
                </button>
              </div>
            ))
          )}
        </div>
        {filteredConcernSummary.length > visibleConcernCount ? (
          <button
            type="button"
            className="mx-auto mt-6 block rounded-full border border-[#cdd8e4] bg-white px-5 py-2 text-[12px] font-bold text-[#173f73] shadow-sm transition hover:bg-[#f0f4f8]"
            onClick={() => setVisibleConcernCount((prev) => prev + 5)}
          >
            See more ({filteredConcernSummary.length - visibleConcernCount} more)
          </button>
        ) : filteredConcernSummary.length > 5 ? (
          <button
            type="button"
            className="mx-auto mt-6 block text-[12px] font-semibold text-[#8a96a8] hover:text-[#173f73]"
            onClick={() => setVisibleConcernCount(5)}
          >
            Show less
          </button>
        ) : null}
      </section>

      <section className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Rating Distribution</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Stars from reviews</p>
          <div className="mt-4 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData}>
                <XAxis dataKey="star" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[5, 5, 0, 0]} fill="#173f73" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Trend Over Time</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Reviews per month</p>
          <div className="mt-4 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="reviews" radius={[5, 5, 0, 0]} fill="#2b6cb0" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Top Countries</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Where reviewers are from</p>
          <div className="mt-4 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 10 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 5, 5, 0]} fill="#8a5a92" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Review Explorer</h3>
            <p className="mt-1 text-[12px] text-[#8793a5]">{filteredReviewsForExplorer.length} reviews — showing {Math.min(reviewVisibleCount, filteredReviewsForExplorer.length)} of {filteredReviewsForExplorer.length} {activeTab !== 'all' ? `(${activeTab})` : ''}</p>
          </div>
          <span className="text-[11px] font-bold capitalize text-[#8a96a8]">{activeTab}</span>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {filteredReviewsForExplorer.length === 0 ? (
            <p className="text-[13px] text-[#8a96a8]">No reviews for “{activeTab}”.</p>
          ) : (
            filteredReviewsForExplorer.slice(0, reviewVisibleCount).map((r, i) => (
              <div key={i} className="rounded-[12px] border border-[#eef1f6] bg-[#fbfcfe] p-4 transition hover:border-[#d7e0ec] hover:bg-white">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${SENT_CLASS[r.sentiment] || SENT_CLASS.neutral}`}>{r.sentiment}</span>
                  <span className="text-[11px] text-[#8a96a8]">{r.rating ? `★ ${r.rating}` : ''}{r.country ? ` · ${r.country}` : ''}</span>
                </div>
                <p className="m-0 text-[13px] leading-[1.5] text-[#33425a]">{r.text}</p>
                {r.aspects?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.aspects.map((a, j) => (
                      <span key={j} className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${SENT_CLASS[a.sentiment] || SENT_CLASS.neutral}`}>{a.aspect}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {filteredReviewsForExplorer.length > reviewVisibleCount ? (
          <button
            type="button"
            className="mx-auto mt-5 block rounded-full border border-[#cdd8e4] bg-white px-5 py-2 text-[12px] font-bold text-[#173f73] shadow-sm transition hover:bg-[#f0f4f8]"
            onClick={() => setReviewVisibleCount((prev) => Math.min(prev + 10, 55))}
          >
            See more ({Math.min(filteredReviewsForExplorer.length - reviewVisibleCount, 10)} more)
          </button>
        ) : filteredReviewsForExplorer.length > 10 ? (
          <button
            type="button"
            className="mx-auto mt-5 block text-[12px] font-semibold text-[#8a96a8] hover:text-[#173f73]"
            onClick={() => setReviewVisibleCount(10)}
          >
            Show less
          </button>
        ) : null}
      </section>

      {/* Tab Board — shows filtered comments for the selected tab */}
      {isBoardOpen && (
        <section className="mb-5 rounded-[15px] border border-[#173f73]/20 bg-gradient-to-br from-[#f8fafd] to-white p-6 shadow-[0_8px_25px_rgba(23,63,115,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="m-0 text-[16px] font-bold capitalize text-[#142b48]">{activeTab} reviews</h3>
              <p className="mt-1 text-[11px] text-[#8a96a8]">{boardReviews.length} comments where feeling is {activeTab}</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-[#cdd8e4] bg-white px-3 py-1.5 text-[11px] font-bold text-[#173f73] hover:bg-[#f0f4f8]"
              onClick={() => setIsBoardOpen(false)}
            >
              Close
            </button>
          </div>
          {boardReviews.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-center text-[13px] text-[#8a96a8]">No {activeTab} reviews in this analysis.</p>
          ) : (
            <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
              {boardReviews.map((r, i) => (
                <div key={i} className="rounded-[12px] border border-[#eef1f6] bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${SENT_CLASS[r.sentiment] || SENT_CLASS.neutral}`}>{r.sentiment}</span>
                    <span className="text-[10px] text-[#8a96a8]">{r.rating ? `★ ${r.rating}` : ''}</span>
                  </div>
                  <p className="m-0 text-[13px] leading-[1.5] text-[#33425a]">{r.text}</p>
                  {r.concerns?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.concerns.map((c, j) => (
                        <span key={j} className="rounded bg-[#f0f4f8] px-2 py-0.5 text-[10px] font-bold capitalize text-[#536a82]">{c.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mb-5 rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
        <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Email this report</h3>
        <p className="mt-1 text-[12px] text-[#8793a5]">Send the full report to a teammate</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="w-full rounded-[10px] border border-[#d7dee8] px-4 py-3 text-[14px] outline-none focus:border-[#173f73] sm:max-w-[320px]"
          />
          <button
            type="button"
            className="cursor-pointer rounded-[10px] bg-[#173f73] px-5 py-3 font-bold text-white transition hover:bg-[#12345f]"
            onClick={send}
          >
            Send report
          </button>
        </div>
        {status && <p className="mt-3 text-[13px] text-[#5a6472]">{status}</p>}
      </section>

      {openConcern && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpenConcern(null)}>
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-[18px] bg-white p-6 sm:max-w-[640px] sm:rounded-[18px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-[18px] font-bold capitalize text-[#172f50]">{openConcern} comments</h3>
              <button type="button" className="text-[13px] font-semibold text-[#173f73]" onClick={() => setOpenConcern(null)}>Close</button>
            </div>
            {loadingComments ? (
              <p className="text-[13px] text-[#8a96a8]">Loading…</p>
            ) : commentError ? (
              <p className="text-[13px] text-[#b42318]">Could not load comments.</p>
            ) : comments.length === 0 ? (
              <p className="text-[13px] text-[#8a96a8]">No comments found.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {comments.map((c, i) => (
                  <div key={i} className="rounded-[12px] border border-[#eef1f6] bg-[#fbfcfe] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${SENT_CLASS[c.sentiment] || SENT_CLASS.neutral}`}>{c.sentiment}</span>
                      <span className="text-[11px] text-[#8a96a8]">{c.rating ? `★ ${c.rating}` : ''}{c.country ? ` · ${c.country}` : ''}</span>
                    </div>
                    <p className="m-0 text-[13px] leading-[1.5] text-[#33425a]">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

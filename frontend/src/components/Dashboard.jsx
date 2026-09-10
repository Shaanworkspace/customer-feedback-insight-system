import { useEffect, useState, useRef } from 'react'
import {
  getHistory,
  getHistoryReport,
  getConcernComments,
  getMe,
  getUser,
  sendReportEmail,
  uploadReviews,
  setApiBase,
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
        <section className="mb-8 rounded-[20px] border border-[#e1e7ef] bg-gradient-to-r from-[#173f73] to-[#2b6cb0] p-8 text-white">
          <div className="text-[11px] font-extrabold tracking-[1.5px] opacity-80">WELCOME TO YOUR WORKSPACE</div>
          <h2 className="mt-1 text-[clamp(26px,3.5vw,36px)] font-bold">Hi {me?.first_name || 'there'} 👋</h2>
          <p className="mt-2 max-w-[620px] text-[15px] opacity-90">
            This is your customer feedback workspace. Open a past analysis to see its full report, or drop a new CSV right here.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-[10px] bg-white px-5 py-3 font-bold text-[#173f73] shadow transition hover:-translate-y-0.5"
              onClick={onUpload}
            >
              + Upload new reviews
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-[10px] border border-white/50 px-5 py-3 font-bold text-white transition hover:bg-white/10"
              onClick={() => downloadText('sample_reviews.csv', sampleCsvText())}
            >
              Download sample CSV
            </button>
          </div>
        </section>

        {/* Professional drag and drop on dashboard */}
        <section className="mb-8">
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop CSV here to upload on dashboard"
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
              const droppedFile = e.dataTransfer.files?.[0]
              handleDashboardFile(droppedFile)
            }}
            className={`flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed bg-white px-6 py-8 text-center shadow-[0_4px_18px_rgba(25,46,72,0.04)] transition
              ${dashboardIsDragging ? 'border-solid border-[#173f73] bg-[#eef4fb]' : 'border-[#cdd8e4] hover:border-[#47739e] hover:bg-[#f5f9fd]'}
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
            <div role="alert" className="mt-3 rounded-lg border border-[#ffd5ce] bg-[#fff0ef] px-3 py-2.5 text-[12px] font-medium text-[#b42318]">
              {dashboardUploadError}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[20px] font-bold text-[#142b48]">Your analyses</h3>
            <span className="text-[12px] text-[#8793a5]">{analyses.length} saved</span>
          </div>

          {listError ? (
            <div className="rounded-[14px] border border-[#ffd5ce] bg-[#fff5f3] p-6 text-center text-[13px] text-[#b42318]">
              Could not load your analyses.
            </div>
          ) : analyses.length === 0 ? (
            <div className="rounded-[15px] border border-dashed border-[#cdd8e4] bg-white p-10 text-center">
              <p className="text-[14px] font-semibold text-[#718097]">No analyses yet.</p>
              <p className="mt-1 text-[13px] text-[#8a96a8]">Upload a CSV to get your first report.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {analyses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => selectAnalysis(a.id)}
                  className="cursor-pointer rounded-[15px] border border-[#e1e7ef] bg-white p-5 text-left shadow-[0_4px_18px_rgba(25,46,72,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(25,46,72,0.08)]"
                >
                  <strong className="block truncate text-[15px] text-[#142b48]">{a.filename || 'Untitled analysis'}</strong>
                  <div className="mt-1 text-[12px] text-[#8793a5]">
                    {a.total_reviews != null ? `${a.total_reviews} reviews · ` : ''}
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(a.top_concerns || []).map((c, i) => (
                      <span key={i} className="rounded-md bg-[#f0f4f8] px-2 py-0.5 text-[10px] font-bold capitalize text-[#536a82]">{c}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
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
            className="cursor-pointer rounded-[10px] bg-[#173f73] px-4 py-3 font-bold text-white shadow transition hover:bg-[#12345f]"
            onClick={onUpload}
          >
            + Upload new
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-[10px] border border-[#173f73] bg-white px-4 py-3 font-bold text-[#173f73] transition hover:bg-[#eef4fb]"
            onClick={() => downloadText('report.csv', reportToCsv(stats))}
          >
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
        <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Priority Concerns</h3>
        <p className="mt-1 text-[12px] text-[#8793a5]">Issues to fix first, ranked by impact</p>
        <div className="mt-5 flex flex-col gap-5">
          {concernSummary.map((c, index) => (
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
          ))}
        </div>
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
        <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Review Explorer</h3>
        <p className="mt-1 text-[12px] text-[#8793a5]">{reviews.length} analyzed reviews</p>
        <div className="mt-5 flex flex-col gap-3">
          {reviews.length === 0 ? (
            <p className="text-[13px] text-[#8a96a8]">No individual reviews available.</p>
          ) : (
            reviews.map((r, i) => (
              <div key={i} className="rounded-[12px] border border-[#eef1f6] bg-[#fbfcfe] p-4">
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
      </section>

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

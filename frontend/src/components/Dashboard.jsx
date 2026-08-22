import { useEffect, useState } from 'react'
import { getStats, getReviews, getConcernComments } from '../api'
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

export default function Dashboard({ analyzing = false, reloadKey = 0, onUpload }) {
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState(false)
  const [openConcern, setOpenConcern] = useState(null)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentError, setCommentError] = useState(false)

  useEffect(() => {
    if (analyzing) return
    setError(false)
    Promise.all([getStats(), getReviews()])
      .then(([s, r]) => { setStats(s); setReviews(r) })
      .catch(() => setError(true))
  }, [analyzing, reloadKey])

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

  if (error) {
    return (
      <div className="rounded-[14px] border border-[#ffd5ce] bg-[#fff5f3] p-8 text-center">
        <div className="text-[14px] font-bold text-[#b42318]">Backend is not reachable.</div>
        <p className="mt-2 text-[13px] text-[#8a5a52]">
          The analysis server is offline or still waking up. Please try again in a moment.
        </p>
      </div>
    )
  }

  if (analyzing || !stats) {
    return (
      <div className="w-full">
        <Skeleton className="mb-8 h-[60px]" />
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[110px]" />)}
        </div>
        <Skeleton className="mb-5 h-[240px]" />
        <Skeleton className="mb-5 h-[240px]" />
        <Skeleton className="mb-5 h-[300px]" />
        <Skeleton className="mb-5 h-[220px]" />
        <Skeleton className="h-[260px]" />
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
          <div className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-[#47739e]">CUSTOMER INTELLIGENCE</div>
          <h2 className="m-0 text-[clamp(26px,3.5vw,36px)] font-bold tracking-tight text-[#142b48]">
            Understand what your customers are saying.
          </h2>
          <p className="mt-2 text-[15px] text-[#718097]">
            {total.toLocaleString()} reviews analyzed · {concerns.length} priority issues found
          </p>
        </div>
        {onUpload && (
          <button
            type="button"
            className="shrink-0 cursor-pointer rounded-[10px] bg-[#173f73] px-5 py-3 font-bold text-white shadow-[0_7px_18px_rgba(23,63,115,0.20)] transition hover:-translate-y-0.5 hover:bg-[#12345f]"
            onClick={onUpload}
          >
            + Upload new reviews
          </button>
        )}
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
                <div className="h-1.5 overflow-hidden rounded-[10px] bg-[#edf1f5]">
                  <div className={`h-full rounded-[10px] ${index === 0 ? 'bg-[#c94a3d]' : 'bg-[#173f73]'}`} style={{ width: `${c.impact}%` }}></div>
                </div>
                <small className="mt-1 block text-[10px] text-[#8a96a8]">{c.negative_pct}% negative sentiment</small>
              </div>
              <div className={`rounded-lg px-2 py-2 text-center text-[12px] font-extrabold ${index === 0 ? 'bg-[#fdeceb] text-[#c94a3d]' : 'bg-[#edf3fa] text-[#173f73]'}`}>
                impact {c.impact}
              </div>
              <button
                className="rounded-lg border border-[#d4deea] px-3 py-2 text-[11px] font-bold text-[#173f73] transition hover:bg-[#edf3fa]"
                onClick={() => openComments(c.concern)}
              >
                View Comments
              </button>
            </div>
          ))}
          {concernSummary.length === 0 && (
            <div className="p-6 text-center text-[13px] text-[#8a96a8]">No concerns detected yet. Upload reviews to get started.</div>
          )}
        </div>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Rating Distribution</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Star ratings from the reviews</p>
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData}>
                <XAxis dataKey="star" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#173f73" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Reviews Over Time</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Volume by year</p>
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData}>
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#25834c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Market by Country</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Where customers are from</p>
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="#b8860b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
        <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Review Explorer</h3>
        <p className="mt-1 text-[12px] text-[#8793a5]">Real customer feedback ({reviews.length} reviews)</p>
        <div className="mt-4 max-h-[380px] overflow-auto rounded-[10px] border border-[#e4e9ef]">
          {reviews.slice(0, 50).map((r) => (
            <div className="grid grid-cols-[1fr_90px_90px] items-start gap-4 border-t border-[#e9edf2] px-4 py-3 text-[13px] text-[#34465d] first:border-t-0 hover:bg-[#fafbfd]" key={r.review_id}>
              <div>
                <span className="block">{r.text}</span>
                {r.concerns?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {r.concerns.map((c, i) => (
                      <span key={i} className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${SENT_CLASS[c.sentiment] || SENT_CLASS.neutral}`}>
                        {c.name}: {c.sentiment}
                      </span>
                    ))}
                  </div>
                )}
                {r.attributes && Object.keys(r.attributes).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {Object.entries(r.attributes).map(([k, v]) => (
                      <span key={k} className="rounded-md bg-[#f0f4f8] px-2 py-0.5 text-[10px] text-[#536a82]"><strong className="font-bold">{k}:</strong> {String(v)}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="mt-1 w-fit rounded-md bg-[#f0f4f8] px-2.5 py-1 text-[10px] font-bold capitalize text-[#536a82]">{r.entity}</span>
              <span className={`mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ${SENT_CLASS[r.sentiment] || SENT_CLASS.neutral}`}>
                {r.sentiment}
              </span>
            </div>
          ))}
        </div>
      </section>

      {openConcern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenConcern(null)}>
          <div className="w-full max-w-2xl rounded-[16px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#eef2f6] px-6 py-4">
              <div>
                <div className="text-[11px] font-extrabold tracking-[1.5px] text-[#47739e]">TOP COMMENTS</div>
                <h3 className="m-0 text-[18px] font-bold capitalize text-[#142b48]">{openConcern}</h3>
              </div>
              <button className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-[#8a96a8] hover:bg-[#f3f6f9]" onClick={() => setOpenConcern(null)}>
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-6">
              {loadingComments && <div className="py-10 text-center text-[13px] text-[#8a96a8]">Loading comments…</div>}
              {commentError && <div className="py-10 text-center text-[13px] text-[#b42318]">Could not load comments.</div>}
              {!loadingComments && !commentError && comments.length === 0 && (
                <div className="py-10 text-center text-[13px] text-[#8a96a8]">No comments found for this concern.</div>
              )}
              <div className="flex flex-col gap-4">
                {comments.map((c) => (
                  <div key={c.review_id} className="rounded-[12px] border border-[#e4e9ef] bg-[#fafbfd] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-[14px] text-[#142b48]">{c.reviewer}</strong>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ${SENT_CLASS[c.sentiment] || SENT_CLASS.neutral}`}>
                        {c.sentiment}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#6b7a8d]">
                      {c.rating != null && <span>★ {c.rating}/5</span>}
                      {c.country && <span>· {c.country}</span>}
                      {c.date && <span>· {c.date}</span>}
                      <span>· {Math.round(c.similarity * 100)}% similar</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#34465d]">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

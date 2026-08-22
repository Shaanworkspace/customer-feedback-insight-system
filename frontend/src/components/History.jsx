import { useEffect, useState } from 'react'
import { getHistory, getHistoryReport, sendReportEmail } from '../api'

export default function History() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [report, setReport] = useState(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    getHistory()
      .then(setItems)
      .catch(() => setError(true))
  }, [])

  const toggle = (id) => {
    if (openId === id) {
      setOpenId(null)
      setReport(null)
      return
    }
    setOpenId(id)
    setReport(null)
    setStatus('')
    getHistoryReport(id)
      .then(setReport)
      .catch(() => setReport({ error: true }))
  }

  const send = (id) => {
    if (!email) {
      setStatus('Enter an email address first.')
      return
    }
    setStatus('Sending…')
    sendReportEmail(email, id)
      .then(() => setStatus(`Report sent to ${email}`))
      .catch((e) => setStatus(e.message || 'Failed to send'))
  }

  if (error) {
    return (
      <div className="rounded-[14px] border border-[#ffd5ce] bg-[#fff5f3] p-8 text-center">
        <div className="text-[14px] font-bold text-[#b42318]">Backend is not reachable.</div>
        <p className="mt-2 text-[13px] text-[#8a5a52]">The analysis server is offline or still waking up.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <section className="mb-8">
        <div className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-[#47739e]">YOUR WORKSPACE</div>
        <h2 className="m-0 text-[clamp(26px,3.5vw,36px)] font-bold tracking-tight text-[#142b48]">
          Analysis History
        </h2>
        <p className="mt-2 text-[15px] text-[#718097]">
          Your last {items.length} uploads, with the full report sent to your inbox on demand.
        </p>
      </section>

      {items.length === 0 ? (
        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-10 text-center text-[13px] text-[#8a96a8] shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          No analyses yet. Upload a CSV to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((it) => {
            const open = openId === it.id
            return (
              <div key={it.id} className="overflow-hidden rounded-[15px] border border-[#e1e7ef] bg-white shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-[#fafbfd]"
                  onClick={() => toggle(it.id)}
                >
                  <div>
                    <div className="text-[15px] font-bold text-[#142b48]">{it.filename || 'Untitled analysis'}</div>
                    <div className="mt-1 text-[12px] text-[#8793a5]">
                      {it.total_reviews != null ? `${it.total_reviews} reviews · ` : ''}
                      {it.created_at ? new Date(it.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-[#173f73]">{open ? 'Hide' : 'View report'}</span>
                </button>

                {open && (
                  <div className="border-t border-[#eef2f6] px-6 py-5">
                    {report?.error ? (
                      <div className="text-[13px] text-[#b42318]">Could not load this report.</div>
                    ) : report ? (
                      <ReportView report={report} />
                    ) : (
                      <div className="py-4 text-center text-[13px] text-[#8a96a8]">Loading report…</div>
                    )}

                    {report && !report.error && (
                      <div className="mt-5 border-t border-[#eef2f6] pt-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="min-w-[220px] flex-1 cursor-pointer rounded-lg border border-[#d9e0e8] bg-white px-3 py-2.5 text-[#35465b]"
                          />
                          <button
                            type="button"
                            className="cursor-pointer rounded-lg bg-[#173f73] px-5 py-2.5 font-bold text-white transition hover:bg-[#12345f]"
                            onClick={() => send(it.id)}
                          >
                            Email this report
                          </button>
                        </div>
                        {status && <div className="mt-3 text-[12px] font-semibold text-[#173f73]">{status}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReportView({ report }) {
  const sd = report.sentiment_distribution || {}
  const concerns = report.ranked_concerns || []

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={report.total_reviews || 0} />
        <Stat label="Positive" value={sd.positive || 0} />
        <Stat label="Negative" value={sd.negative || 0} />
        <Stat label="Mixed / Neutral" value={(sd.mixed || 0) + (sd.neutral || 0)} />
      </div>

      <h3 className="mb-2 text-[14px] font-bold text-[#172f50]">Top Concerns</h3>
      {concerns.length === 0 ? (
        <div className="text-[13px] text-[#8a96a8]">No concerns detected.</div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-[#e4e9ef]">
          <div className="grid grid-cols-[1fr_90px_90px_70px] gap-3 bg-[#f5f7fa] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#66768b]">
            <span>Concern</span>
            <span>Mentions</span>
            <span>Negative</span>
            <span>Impact</span>
          </div>
          {concerns.slice(0, 10).map((c, i) => (
            <div key={c.concern} className="grid grid-cols-[1fr_90px_90px_70px] items-center gap-3 border-t border-[#e9edf2] px-4 py-2.5 text-[13px] capitalize text-[#34465d]">
              <span>{c.concern}</span>
              <span>{c.count}</span>
              <span>{c.negative_pct}%</span>
              <span>{c.impact}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-[12px] border border-[#e1e7ef] bg-[#fafbfd] p-4">
      <div className="text-[12px] font-semibold text-[#718097]">{label}</div>
      <strong className="mt-1 block text-[22px] font-bold text-[#142b48]">{value}</strong>
    </div>
  )
}

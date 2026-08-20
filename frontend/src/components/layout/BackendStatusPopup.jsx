import { useEffect, useState } from 'react'
import { pingBackend } from '../../api'

export default function BackendStatusPopup({ base }) {
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    pingBackend()
      .then((msg) => {
        if (cancelled) return
        setMessage(msg)
        setState('online')
      })
      .catch(() => {
        if (cancelled) return
        setState('offline')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const style = {
    loading: 'border-[#e2e8f0] bg-white text-[#5e6d82]',
    online: 'border-[#bde5cd] bg-[#effaf3] text-[#1f7c46]',
    offline: 'border-[#ffd5ce] bg-[#fff5f3] text-[#b42318]',
  }

  return (
    <div
      className={`fixed right-5 top-5 z-50 flex items-center gap-3 rounded-[12px] border px-4 py-3 text-[12px] font-semibold shadow-[0_8px_24px_rgba(23,63,115,0.15)] ${style[state]}`}
      data-base={base}
    >
      {state === 'loading' && (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#173f73] border-t-transparent"></span>
          Loading… connecting to backend
        </>
      )}
      {state === 'online' && (
        <>
          <span className="inline-block h-2 w-2 rounded-full bg-[#2eaf62]"></span>
          Backend online: {message}
        </>
      )}
      {state === 'offline' && (
        <>
          <span className="inline-block h-2 w-2 rounded-full bg-[#e0563d]"></span>
          Backend offline. Please try again.
        </>
      )}
    </div>
  )
}
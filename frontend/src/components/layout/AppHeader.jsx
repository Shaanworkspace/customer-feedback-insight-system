import { useState, useEffect, useRef } from 'react'
import logo from '../../assets/logo.svg'
import { getUser, setToken, setUser } from '../../api'

export default function AppHeader({ tab, setTab, onUpload, signedIn, onLogout, onProfile }) {
  const tabs = ['dashboard', 'analyzer', 'explorer']
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => getUser())
  const popRef = useRef(null)

  useEffect(() => setCurrentUser(getUser()), [signedIn, tab])

  useEffect(() => {
    function handleClickOutside(event) {
      if (popRef.current && !popRef.current.contains(event.target)) setIsProfileOpen(false)
    }
    if (isProfileOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

  return (
    <header className="topbar glass">
      <div className="brand">
        <img src={logo} alt="Customer Feedback Insight System" className="brand-icon" />
        <div>
          <h1>Customer Feedback</h1>
          <span>Insight System</span>
        </div>
      </div>

      <nav className="main-nav">
        {tabs.map((t) => (
          <button
            key={t}
            className={tab === t ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button className="upload-nav-btn" onClick={onUpload}>
          + Upload
        </button>
        {signedIn ? (
          <div className="relative ml-2" ref={popRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#173f73] text-[12px] font-extrabold text-white shadow"
              aria-label="Profile"
            >
              {(currentUser?.first_name || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 top-10 w-44 rounded-xl border border-[#e1e7ef] bg-white p-2 shadow-[0_12px_30px_rgba(23,63,115,0.15)]">
                <button type="button" onClick={() => { setIsProfileOpen(false); onProfile?.() }} className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-[#173f73] hover:bg-[#f0f4f8]">
                  Visit Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setToken('')
                    setUser(null)
                    onLogout?.()
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-[#b42318] hover:bg-[#fff0ef]"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <a href="/?view=login" className="ml-2 rounded-full bg-[#173f73] px-4 py-2 text-[12px] font-bold text-white shadow hover:bg-[#12345f]">
            Login
          </a>
        )}
      </nav>
    </header>
  )
}
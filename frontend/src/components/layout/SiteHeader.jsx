import { useState, useEffect, useRef } from 'react'
import logo from '../../assets/logo.svg'
import { getUser, setToken, setUser } from '../../api'

export default function SiteHeader({ signedIn }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => getUser())
  const popRef = useRef(null)

  useEffect(() => {
    setCurrentUser(getUser())
  }, [signedIn])

  useEffect(() => {
    function handleClickOutside(event) {
      if (popRef.current && !popRef.current.contains(event.target)) setIsProfileOpen(false)
    }
    if (isProfileOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

  function handleLogout() {
    setToken('')
    setUser(null)
    window.location.href = '/?view=landing'
  }

  const displayName = currentUser?.first_name || currentUser?.email || 'Profile'

  return (
    <header className="site-header glass">
      <div className="site-brand">
        <img src={logo} alt="Customer Feedback Insight System" className="site-logo" />
        <div>
          <strong>Customer Feedback</strong>
          <span>Insight System</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="site-header-badge">AI-powered insights</div>
        {!signedIn ? (
          <a href="/?view=login" className="rounded-full bg-[#173f73] px-4 py-2 text-[12px] font-bold text-white shadow hover:bg-[#12345f]">
            Login
          </a>
        ) : (
          <div className="relative" ref={popRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173f73] text-[13px] font-extrabold text-white shadow"
              aria-label="Profile menu"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 top-11 w-48 rounded-xl border border-[#e1e7ef] bg-white p-2 shadow-[0_12px_30px_rgba(23,63,115,0.15)]">
                <div className="px-3 py-2">
                  <div className="text-[13px] font-bold text-[#142b48]">{displayName}</div>
                  <div className="text-[11px] text-[#8a96a8]">{currentUser?.email || ''}</div>
                </div>
                <hr className="my-1 border-[#eef1f6]" />
                <a href="/?view=profile" className="block rounded-lg px-3 py-2 text-[13px] font-semibold text-[#173f73] hover:bg-[#f0f4f8]">
                  Visit Profile
                </a>
                <button type="button" onClick={handleLogout} className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-[#b42318] hover:bg-[#fff0ef]">
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
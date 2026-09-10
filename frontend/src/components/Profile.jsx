import { useEffect, useState } from 'react'
import { getMe, getUser, getHistory, deleteHistory } from '../api'

export default function Profile({ onBack }) {
  const [profileUser, setProfileUser] = useState(() => getUser())
  const [historyList, setHistoryList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    async function loadProfileData() {
      setIsLoading(true)
      setLoadingError('')
      try {
        const userData = await getMe().catch(() => getUser())
        if (userData) setProfileUser(userData)
        const historyData = await getHistory()
        setHistoryList(historyData)
      } catch (error) {
        setLoadingError(error.message || 'Could not load profile')
      } finally {
        setIsLoading(false)
      }
    }
    loadProfileData()
  }, [])

  async function handleDelete(analysisId, fileName) {
    setDeletingId(analysisId)
    try {
      await deleteHistory(analysisId)
      setHistoryList((prev) => prev.filter((item) => item.id !== analysisId))
    } catch (error) {
      alert(error.message || 'Could not delete')
    } finally {
      setDeletingId(null)
      setShowDeleteConfirm(null)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-[#e6ecf3]" />
        <div className="h-64 animate-pulse rounded-[16px] bg-[#e6ecf3]" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <button type="button" onClick={onBack} className="mb-4 text-[13px] font-semibold text-[#173f73] hover:underline">
        ← Back to dashboard
      </button>

      <div className="mb-8 rounded-[16px] border border-[#e1e7ef] bg-white p-8 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#173f73] text-[20px] font-extrabold text-white">
            {(profileUser?.first_name || profileUser?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#142b48]">{profileUser?.first_name || 'Your Profile'}</h2>
            <p className="mt-1 text-[13px] text-[#5a6d80]">{profileUser?.email || 'No email'}</p>
            <p className="mt-3 text-[11px] font-bold tracking-wide text-[#8a96a8]">Member since {profileUser?.created_at ? new Date(profileUser.created_at).toLocaleDateString() : 'recently'} · {historyList.length} analyses saved</p>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-extrabold text-[#142b48]">Your past analyses</h3>
          <span className="text-[11px] font-bold text-[#8a96a8]">{historyList.length} saved · Last 3 kept</span>
        </div>

        {loadingError ? (
          <div className="rounded-lg border border-[#ffd5ce] bg-[#fff0ef] p-4 text-center text-[13px] text-[#b42318]">{loadingError}</div>
        ) : historyList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cdd8e4] bg-[#f8fafc] p-8 text-center">
            <p className="text-[14px] font-semibold text-[#718097]">No analyses yet</p>
            <p className="mt-1 text-[12px] text-[#8a96a8]">Upload a CSV to see it here. Your history is per-user and private.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {historyList.map((item) => (
              <div key={item.id} className="group relative rounded-[14px] border border-[#e1e7ef] bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-[14px] font-bold text-[#142b48]">{item.filename || 'Untitled analysis'}</strong>
                    <div className="mt-1 text-[11px] text-[#8a96a8]">
                      {item.total_reviews != null ? `${item.total_reviews} reviews · ` : ''}
                      {item.created_at ? `${new Date(item.created_at).toLocaleDateString()} ${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(item.id)}
                    disabled={deletingId === item.id}
                    className="hidden h-7 w-7 items-center justify-center rounded-full bg-white text-[#8a96a8] shadow group-hover:flex hover:bg-[#fff0ef] hover:text-[#b42318]"
                    aria-label="Delete"
                  >
                    {deletingId === item.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#b42318] border-t-transparent" /> : '×'}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(item.top_concerns || []).map((concern, idx) => (
                    <span key={idx} className="rounded bg-[#f0f4f8] px-2 py-1 text-[10px] font-bold capitalize text-[#536a82]">{concern}</span>
                  ))}
                </div>

                {showDeleteConfirm === item.id && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[14px] bg-white/95 p-4 backdrop-blur-sm">
                    <p className="text-center text-[12px] font-semibold text-[#142b48]">Delete “{item.filename || 'this analysis'}”?</p>
                    <p className="text-center text-[10px] text-[#8a96a8]">This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(null)}
                        className="rounded-full border border-[#cdd8e4] bg-white px-4 py-1.5 text-[11px] font-bold text-[#5a6d80] hover:bg-[#f0f4f8]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.filename)}
                        className="rounded-full bg-[#c94a3d] px-4 py-1.5 text-[11px] font-bold text-white hover:bg-[#b42318]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AppHeader({ tab, setTab, onUpload }) {
  const tabs = ['dashboard', 'analyzer', 'explorer']

  return (
    <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-[#e4e9f0] bg-white/95 px-[6%] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-gradient-to-br from-[#173f73] to-[#2d6aa8] font-extrabold tracking-tight text-white shadow-[0_4px_12px_rgba(23,63,115,0.25)]">
          CF
        </div>
        <div>
          <h1 className="m-0 text-[17px] leading-tight text-[#152c4a]">Customer Feedback</h1>
          <span className="text-[12px] text-[#74839a]">Insight System</span>
        </div>
      </div>

      <nav className="flex items-center gap-1.5 rounded-[12px] bg-[#f2f5f9] p-1.5">
        {tabs.map((t) => (
          <button
            key={t}
            className={
              tab === t
                ? 'rounded-[8px] bg-white px-4 py-2 font-semibold text-[#173f73] shadow-[0_2px_8px_rgba(23,63,115,0.15)]'
                : 'cursor-pointer rounded-[8px] border-0 bg-transparent px-4 py-2 font-semibold text-[#5e6d82] transition hover:text-[#173f73]'
            }
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button
          className="cursor-pointer rounded-[9px] bg-[#173f73] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_5px_14px_rgba(23,63,115,0.22)] transition hover:-translate-y-0.5 hover:bg-[#12345f]"
          onClick={onUpload}
        >
          + Upload
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#2d6aa8] text-[13px] font-bold text-white shadow-[0_3px_10px_rgba(23,63,115,0.25)]">
          SA
        </div>
      </div>
    </header>
  )
}
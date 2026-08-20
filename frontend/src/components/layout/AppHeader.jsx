export default function AppHeader({ tab, setTab, onUpload }) {
  const tabs = ['dashboard', 'analyzer', 'explorer']

  return (
    <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-[#e4e9f0] bg-white/95 px-[6%] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#173f73] font-extrabold tracking-tight text-white">
          CF
        </div>
        <div>
          <h1 className="m-0 text-[17px] leading-tight text-[#152c4a]">Customer Feedback</h1>
          <span className="text-[12px] text-[#74839a]">Insight System</span>
        </div>
      </div>

      <nav className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            className={
              tab === t
                ? 'rounded-[9px] bg-[#173f73] px-4 py-2.5 font-semibold text-white shadow-[0_4px_12px_rgba(23,63,115,0.2)]'
                : 'cursor-pointer rounded-[9px] border border-transparent bg-transparent px-4 py-2.5 font-semibold text-[#5e6d82] transition hover:bg-[#edf3fa] hover:text-[#173f73]'
            }
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button className="cursor-pointer rounded-[9px] bg-[#173f73] px-4 py-2.5 font-semibold text-white" onClick={onUpload}>
          + Upload
        </button>
      </nav>
    </header>
  )
}
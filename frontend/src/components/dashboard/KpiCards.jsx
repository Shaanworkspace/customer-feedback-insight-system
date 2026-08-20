export default function KpiCards({ total, positive, negative, positivePct, negativePct, concernCount }) {
  const cards = [
    { label: 'Total Reviews', value: total.toLocaleString(), sub: '● Dataset analyzed' },
    { label: 'Positive Reviews', value: positive.toLocaleString(), sub: `${positivePct}% of all reviews` },
    { label: 'Negative Reviews', value: negative.toLocaleString(), sub: `${negativePct}% of all reviews` },
    { label: 'Priority Issues', value: concernCount, sub: 'Customer concerns detected' },
  ]

  return (
    <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          className="rounded-[14px] border border-[#e1e7ef] bg-white p-5 shadow-[0_4px_18px_rgba(25,46,72,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(25,46,72,0.08)]"
          key={c.label}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#718097]">{c.label}</span>
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[#edf3fa] font-extrabold text-[#173f73]">
              ▤
            </span>
          </div>
          <strong className="mt-3 block text-[29px] font-bold tracking-tight text-[#142b48]">{c.value}</strong>
          <div className="mt-2 text-[11px] text-[#25834c]">{c.sub}</div>
        </div>
      ))}
    </section>
  )
}
export default function StatsSection() {
  const stats = [
    { value: '20,000+', label: 'Reviews analyzed' },
    { value: '4', label: 'Priority concerns detected' },
    { value: '62%', label: 'Positive sentiment' },
    { value: '100%', label: 'Proof-backed insights' },
  ]

  return (
    <section className="relative overflow-hidden px-6 py-[110px]">
      <div
        className="absolute inset-0 bg-cover bg-center blur-[3px] saturate-110"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1800&q=70')",
        }}
        role="presentation"
      ></div>
      <div className="absolute inset-0 bg-[rgba(19,42,72,0.78)]" role="presentation"></div>

      <div className="relative z-10 mx-auto grid max-w-[1100px] grid-cols-1 gap-6 rounded-3xl border border-white/15 bg-white/[0.08] p-12 text-center backdrop-blur-[18px] md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <strong className="block text-[42px] font-bold tracking-tight text-white">{s.value}</strong>
            <span className="mt-2.5 block text-[14px] text-[#cfe0f2]">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
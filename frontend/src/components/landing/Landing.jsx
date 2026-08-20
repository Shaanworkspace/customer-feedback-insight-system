export default function Landing({ onStart }) {
  return (
    <main className="flex flex-1 flex-col">
      <Hero onStart={onStart} />
      <WhyUs />
      <Features />
      <HowItWorks />
      <StatsSection />
    </main>
  )
}
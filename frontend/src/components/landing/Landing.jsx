import Hero from './Hero'
import WhyUs from './WhyUs'
import Features from './Features'
import HowItWorks from './HowItWorks'
import StatsSection from './StatsSection'

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
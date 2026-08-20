import Hero from './Hero'
import Problem from './Problem'
import Features from './Features'
import HowItWorks from './HowItWorks'
import StatsSection from './StatsSection'

export default function Landing({ onStart }) {
  return (
    <div className="landing-page">
      <Hero onStart={onStart} />
      <Problem />
      <Features />
      <HowItWorks />
      <StatsSection />
    </div>
  )
}
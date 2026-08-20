import Hero from './Hero'
import WhyUs from './WhyUs'
import Features from './Features'
import HowItWorks from './HowItWorks'
import StatsSection from './StatsSection'

export default function Landing({ onStart }) {
  return (
    <div className="landing-page">
      <Hero onStart={onStart} />
      <WhyUs />
      <Features />
      <HowItWorks />
      <StatsSection />
    </div>
  )
}
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { LandingFooter } from "@/components/landing/footer"
import { ClientWrapper } from "@/components/landing/client-wrapper"

export default function LandingPage() {
  return (
    <ClientWrapper>
      <div className="min-h-screen">
        <Hero />
        <Features />
        <Pricing />
        <LandingFooter />
      </div>
    </ClientWrapper>
  )
}

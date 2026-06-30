import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/landing/HeroSection'
import StatsSection from '../components/landing/StatsSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import ServicesSection from '../components/landing/ServicesSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import { ROUTES } from '../routes/routes'

function CtaSection() {
  return (
    <section
      className="py-20"
      style={{ background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)' }}
      aria-label="Call to action"
    >
      <div className="max-w-[1280px] mx-auto px-4 text-center">
        <h2 className="font-medium text-[36px] text-white leading-10 tracking-[0.37px] mb-4">
          Siap Mengajukan Permohonan?
        </h2>
        <p className="text-[18px] leading-7 max-w-[480px] mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Daftar sekarang dan nikmati kemudahan layanan administrasi Desa Wates secara online
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to={ROUTES.REGISTER}>
            <button className="h-12 px-8 rounded-xl bg-white text-[#1e40af] font-semibold text-[16px] hover:bg-blue-50 transition-colors cursor-pointer">
              Daftar Sekarang
            </button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <button
              className="h-12 px-8 rounded-xl font-semibold text-[16px] text-white cursor-pointer border-0 hover:bg-white/10 transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              Masuk ke Akun
            </button>
          </Link>
        </div>
        <p className="mt-6 text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Jam layanan: Senin–Jumat 08.00–15.00 WIB &nbsp;·&nbsp; Balai Desa Wates, Kec. Tanjunganom, Kab. Nganjuk
        </p>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Stats — overlaps hero bottom */}
        <div className="relative z-10 -mt-16">
          <StatsSection />
        </div>

        {/* 3. How it works */}
        <HowItWorksSection />

        {/* 4. All 6 services */}
        <ServicesSection />

        {/* 5. AI features */}
        <FeaturesSection />

        {/* 6. CTA */}
        <CtaSection />
      </main>

      <Footer />
    </div>
  )
}

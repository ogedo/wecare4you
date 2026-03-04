import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Mental health support,<br />anytime.
          </h1>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Connect with licensed Nigerian therapists and trained peer support
            companions — from the comfort of your phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#download"
              className="px-8 py-4 bg-white text-primary-600 rounded-2xl font-bold text-lg hover:bg-primary-50 transition-colors"
            >
              Get Support
            </a>
            <Link
              href="/register"
              className="px-8 py-4 bg-primary-700 text-white rounded-2xl font-bold text-lg hover:bg-primary-800 border border-primary-400 transition-colors"
            >
              Join as Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-white border-b border-neutral-100 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-sm font-medium text-neutral-600">
          <span className="flex items-center gap-2">
            <span className="text-primary-500 font-bold text-lg">300+</span> licensed therapists
          </span>
          <span className="hidden sm:block text-neutral-200">|</span>
          <span className="flex items-center gap-2">
            <span className="text-primary-500 font-bold text-lg">5,000+</span> patients helped
          </span>
          <span className="hidden sm:block text-neutral-200">|</span>
          <span className="flex items-center gap-2">
            <span className="text-primary-500 font-bold text-lg">4.8</span> average rating
          </span>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-4">How it works</h2>
          <p className="text-center text-neutral-500 mb-14">Three simple steps to get the support you deserve</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign up", desc: "Download the app and create your account with just your phone number. No paperwork." },
              { step: "2", title: "Browse & Book", desc: "Browse licensed therapists or peer buddies, see their rates, and pick a slot that works for you." },
              { step: "3", title: "Talk", desc: "Join your session via secure video or audio call. Safe, private, and encrypted end-to-end." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-5">
                  {step}
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-4">Everything you need</h2>
          <p className="text-center text-neutral-500 mb-14">Built for Nigerian lives, designed for everyone</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🩺", title: "Licensed Therapists", desc: "MDCN-verified professionals with specializations in anxiety, depression, trauma, and more." },
              { icon: "💬", title: "Talk Buddies", desc: "Trained peer supporters for everyday stress and emotional check-ins — at affordable rates." },
              { icon: "📹", title: "Video & Audio", desc: "High-quality video calls that adapt to your network speed. Audio-only when you need discretion." },
              { icon: "🔒", title: "Private & Secure", desc: "End-to-end encrypted sessions. Your conversations are never shared or sold." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-neutral-200 p-6 hover:border-primary-200 hover:shadow-sm transition-all">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-neutral-900 mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section id="providers" className="py-20 px-4 bg-primary-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Earn on your own schedule</h2>
          <p className="text-neutral-600 mb-10 max-w-xl mx-auto">
            Join hundreds of therapists and peer supporters already earning on WeCare4You.
          </p>
          <div className="bg-white rounded-2xl border border-primary-100 p-8 mb-10 max-w-sm mx-auto">
            <p className="text-sm text-neutral-500 mb-1">Example: ₦20,000 session</p>
            <p className="text-4xl font-bold text-primary-600 mb-1">₦16,000</p>
            <p className="text-sm text-neutral-500">take-home per session (80%)</p>
          </div>
          <Link
            href="/register"
            className="px-8 py-4 bg-primary-500 text-white rounded-2xl font-bold text-lg hover:bg-primary-600 transition-colors inline-block"
          >
            Join as Provider
          </Link>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Built on trust</h2>
          <p className="text-neutral-500 mb-12">Your privacy and safety are our foundation</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: "🛡️", title: "NDPR Compliant", desc: "We comply with Nigeria's Data Protection Regulation. Your data stays yours." },
              { icon: "✅", title: "BVN-Verified Providers", desc: "Every therapist and buddy is identity-verified before joining the platform." },
              { icon: "🔐", title: "Encrypted Messages", desc: "All messages are encrypted in transit and at rest. Zero access by our team." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-bold text-neutral-900 mb-2">{title}</h3>
                <p className="text-sm text-neutral-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="py-20 px-4 bg-gradient-to-br from-primary-600 to-primary-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Download the app</h2>
          <p className="text-primary-100 mb-10">Available on iOS and Android. Free to download.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center gap-3 px-6 py-4 bg-black rounded-2xl hover:bg-neutral-900 transition-colors"
            >
              <span className="text-2xl">🍎</span>
              <div className="text-left">
                <p className="text-xs text-neutral-400">Download on the</p>
                <p className="font-semibold">App Store</p>
              </div>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-3 px-6 py-4 bg-black rounded-2xl hover:bg-neutral-900 transition-colors"
            >
              <span className="text-2xl">▶</span>
              <div className="text-left">
                <p className="text-xs text-neutral-400">Get it on</p>
                <p className="font-semibold">Google Play</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

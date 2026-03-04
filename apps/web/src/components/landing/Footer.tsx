import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-400 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Company */}
          <div>
            <p className="text-white font-semibold mb-4">WeCare4You</p>
            <p className="text-sm leading-relaxed">
              Mental health support for every Nigerian, anytime.
            </p>
          </div>

          {/* For Patients */}
          <div>
            <p className="text-white font-semibold mb-4">For Patients</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#download" className="hover:text-white transition-colors">Download App</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <p className="text-white font-semibold mb-4">For Providers</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-white transition-colors">Join as Provider</Link></li>
              <li><a href="#providers" className="hover:text-white transition-colors">Provider Earnings</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Provider Login</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white font-semibold mb-4">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">NDPR Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} WeCare4You. All rights reserved.</p>
          <p>Made with care in Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}

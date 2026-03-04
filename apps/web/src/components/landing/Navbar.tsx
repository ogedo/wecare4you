"use client";

import { useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary-600">
          WeCare4You
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
          <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
          <a href="#providers" className="hover:text-primary-600 transition-colors">For Providers</a>
          <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How it Works</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-0.5 bg-neutral-700 mb-1" />
          <div className="w-5 h-0.5 bg-neutral-700 mb-1" />
          <div className="w-5 h-0.5 bg-neutral-700" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-4 py-4 space-y-3">
          <a href="#features" className="block text-sm font-medium text-neutral-600 py-2">Features</a>
          <a href="#providers" className="block text-sm font-medium text-neutral-600 py-2">For Providers</a>
          <a href="#how-it-works" className="block text-sm font-medium text-neutral-600 py-2">How it Works</a>
          <Link href="/login" className="block text-sm font-medium text-neutral-600 py-2">Sign In</Link>
          <Link
            href="/register"
            className="block w-full text-center px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold text-[#006B3C]">InvoiceNaija</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/auth')}
                className="text-gray-600 hover:text-[#006B3C] transition-colors font-medium"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="bg-[#006B3C] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#005a32] transition-colors"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white px-4 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-[#006B3C] to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Get Paid the Right Amount.<br />
                <span className="text-[#006B3C]">Every Time.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Create professional invoices in 2 minutes. Share on WhatsApp. Stop getting underpaid.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => router.push('/auth')}
                  className="bg-[#006B3C] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#005a32] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Start Free — No Credit Card
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="border-2 border-[#006B3C] text-[#006B3C] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#006B3C] hover:text-white transition-all duration-200"
                >
                  See How It Works
                </button>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <span className="text-yellow-400 text-xl">⭐</span>
                <span className="font-medium">Trusted by Nigerian freelancers</span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200 transform hover:scale-105 transition-transform duration-300">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl">⚡</span>
                    <span className="text-xl font-bold text-[#006B3C]">InvoiceNaija</span>
                  </div>
                  <p className="text-sm text-gray-600">Professional Invoicing Made Easy</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Invoice #:</span>
                    <span className="font-semibold text-gray-900">INV-2026-001</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Client:</span>
                    <span className="font-semibold text-gray-900">ABC Company Ltd</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Due Date:</span>
                    <span className="font-semibold text-gray-900">March 25, 2026</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Website Design</span>
                      <span className="font-semibold">₦120,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Mobile App</span>
                      <span className="font-semibold">₦80,000</span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-[#006B3C]">₦200,000</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 bg-[#FFB800] bg-opacity-10 p-4 rounded-lg border border-[#FFB800] border-opacity-20">
                  <p className="text-sm font-medium text-[#006B3C] mb-2">Payment Details</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><span className="font-medium">Bank:</span> GTBank</p>
                    <p><span className="font-medium">Account:</span> 0123456789</p>
                    <p><span className="font-medium">Name:</span> John Doe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-[#006B3C] px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-16">
            Sound familiar?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-5xl mb-6">😤</div>
              <p className="text-gray-800 text-lg leading-relaxed">
                "Client paid ₦80k instead of ₦150k and said 'balance later'"
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-5xl mb-6">📱</div>
              <p className="text-gray-800 text-lg leading-relaxed">
                "Sending your account number on WhatsApp and praying they pay correctly"
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-5xl mb-6">😰</div>
              <p className="text-gray-800 text-lg leading-relaxed">
                "No proof of what was agreed when clients dispute your price"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-16">
            InvoiceNaija fixes all of this
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl mb-6">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create in 2 Minutes</h3>
              <p className="text-gray-600 leading-relaxed">
                Fill in client details, add your services, generate a professional PDF invoice
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl mb-6">💬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Share on WhatsApp Instantly</h3>
              <p className="text-gray-600 leading-relaxed">
                One tap sends your invoice directly to your client with your bank details
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl mb-6">✅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Track Every Payment</h3>
              <p className="text-gray-600 leading-relaxed">
                See who has paid, who owes you, and your total income at a glance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-16">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-20 h-20 bg-[#006B3C] text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                1️⃣
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Your Invoice</h3>
              <p className="text-gray-600 leading-relaxed">
                Add client details and your services. Takes less than 2 minutes.
              </p>
            </div>
            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-20 h-20 bg-[#006B3C] text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                2️⃣
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Send on WhatsApp</h3>
              <p className="text-gray-600 leading-relaxed">
                Share your professional invoice directly to your client's WhatsApp.
              </p>
            </div>
            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-20 h-20 bg-[#006B3C] text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                3️⃣
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Paid & Track</h3>
              <p className="text-gray-600 leading-relaxed">
                Client pays to your bank account. Mark as paid on your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-16">
            Built for Nigerian Freelancers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { emoji: '🎨', title: 'Graphic Designers' },
              { emoji: '💻', title: 'Web Developers' },
              { emoji: '📸', title: 'Photographers' },
              { emoji: '🎬', title: 'Videographers' },
              { emoji: '✍️', title: 'Content Creators' },
              { emoji: '🍽️', title: 'Caterers' },
              { emoji: '💄', title: 'Makeup Artists' },
              { emoji: '👗', title: 'Fashion Designers' },
              { emoji: '🎵', title: 'Musicians & MCs' },
              { emoji: '📐', title: 'Architects' }
            ].map((profession, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl text-center hover:bg-[#006B3C] hover:text-white transition-all duration-300 cursor-pointer group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{profession.emoji}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-white">{profession.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-16">
            Simple, Affordable Pricing
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">FREE</h3>
                <div className="text-5xl font-bold text-gray-900 mb-4">₦0<span className="text-lg text-gray-600">/month</span></div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">5 invoices per month</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Professional PDF invoices</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">WhatsApp sharing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Payment tracking</span>
                </li>
                <li className="flex items-center">
                  <span className="text-red-500 mr-3 text-xl">✗</span>
                  <span className="text-gray-500">No logo upload</span>
                </li>
                <li className="flex items-center">
                  <span className="text-red-500 mr-3 text-xl">✗</span>
                  <span className="text-gray-500">InvoiceNaija branding</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/auth')}
                className="w-full bg-gray-100 text-gray-800 py-4 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Get Started Free
              </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border-4 border-[#FFB800] hover:shadow-xl transition-shadow duration-300 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#FFB800] text-[#006B3C] px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">PREMIUM</h3>
                <div className="text-5xl font-bold text-gray-900 mb-4">₦2,000<span className="text-lg text-gray-600">/month</span></div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Unlimited invoices</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Your logo on invoices</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Remove InvoiceNaija branding</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Income dashboard & charts</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Client address book</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/upgrade')}
                className="w-full bg-[#006B3C] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#005a32] transition-colors"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-[#006B3C] px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-16">
            What Freelancers Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-5xl mb-4">"</div>
              <p className="text-gray-800 mb-6 leading-relaxed">
                I used to lose money every month to clients who underpaid. InvoiceNaija changed everything.
              </p>
              <div className="border-t pt-4">
                <p className="font-bold text-gray-900">Chioma A.</p>
                <p className="text-gray-600">Graphic Designer, Lagos</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-5xl mb-4">"</div>
              <p className="text-gray-800 mb-6 leading-relaxed">
                My clients now take me seriously. I landed my first corporate client after sending a proper invoice.
              </p>
              <div className="border-t pt-4">
                <p className="font-bold text-gray-900">Emeka O.</p>
                <p className="text-gray-600">Web Developer, Abuja</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-5xl mb-4">"</div>
              <p className="text-gray-800 mb-6 leading-relaxed">
                I made ₦50,000 more last month just because I started sending proper invoices.
              </p>
              <div className="border-t pt-4">
                <p className="font-bold text-gray-900">Blessing N.</p>
                <p className="text-gray-600">Photographer, Port Harcourt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to Get Paid Properly?
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Join thousands of Nigerian freelancers who get paid the right amount, every time.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-[#006B3C] text-white px-12 py-5 rounded-lg font-bold text-xl hover:bg-[#005a32] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 mb-6"
          >
            Create Your Free Account
          </button>
          <div className="text-gray-600 space-y-1">
            <p className="font-medium">Free forever • No credit card required • Setup in 2 minutes</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#006B3C] text-white px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">⚡</span>
                <span className="text-xl font-bold">InvoiceNaija</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Professional invoicing for Nigerian freelancers. Get paid the right amount, every time.
              </p>
              <p className="text-gray-400 text-sm">Made with ❤️ in Nigeria 🇳🇬</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-300">
                <li><button onClick={() => router.push('/dashboard')} className="hover:text-white transition-colors">Dashboard</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => router.push('/auth')} className="hover:text-white transition-colors">Login</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">
              © 2026 InvoiceNaija. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
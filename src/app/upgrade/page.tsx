'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Profile {
  business_name: string
  phone: string
  bank_name: string
  account_number: string
  account_name: string
  plan?: string
}

export default function UpgradePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      setUser(user)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    fetchUser()
  }, [router])

  const handleUpgrade = async () => {
    if (!user?.email) return

    setUpgrading(true)

    try {
      // Import Paystack inline
      const { default: PaystackPop } = await import('@paystack/inline-js')

      const popup = new PaystackPop()

      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: user.email,
        amount: 200000, // ₦2,000 in kobo
        currency: 'NGN',
        onSuccess: async (transaction: any) => {
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ plan: 'premium' })
              .eq('id', user.id)

            if (error) throw error

            // Show success message
            alert('Welcome to Premium! 🎉')

            // Update local profile state
            setProfile(prev => prev ? { ...prev, plan: 'premium' } : null)

            // Redirect to dashboard
            router.push('/dashboard')
          } catch (err: any) {
            alert('Error updating plan: ' + err.message)
          }
        },
        onCancel: () => {
          alert('Payment cancelled')
        }
      })
    } catch (error) {
      console.error('Payment initialization error:', error)
      alert('Failed to initialize payment')
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (profile?.plan === 'premium') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#006B3C] mb-4">You're already Premium! 🎉</h1>
            <p className="text-gray-600 mb-8">You have access to all premium features.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#006B3C] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#005a32] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#006B3C] mb-4">Choose Your Plan</h1>
          <p className="text-gray-600">Select the plan that best fits your invoicing needs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* FREE PLAN */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">FREE PLAN</h2>
              <div className="text-4xl font-bold text-[#006B3C] mb-1">₦0<span className="text-lg font-normal">/month</span></div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>5 invoices per month</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>InvoiceNaija branding</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Basic features</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full bg-gray-100 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* PREMIUM PLAN */}
          <div className="bg-white border-4 border-[#FFB800] rounded-lg p-8 shadow-lg relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#FFB800] text-[#006B3C] px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </span>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">PREMIUM PLAN</h2>
              <div className="text-4xl font-bold text-[#006B3C] mb-1">₦2,000<span className="text-lg font-normal">/month</span></div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Unlimited invoices</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Your logo on invoices</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Remove InvoiceNaija branding</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Client address book</span>
              </li>
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full bg-[#FFB800] text-[#006B3C] px-6 py-3 rounded-lg font-bold text-lg hover:bg-[#e6a600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {upgrading ? 'Processing...' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
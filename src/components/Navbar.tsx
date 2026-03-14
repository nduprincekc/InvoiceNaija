'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const [plan, setPlan] = useState<string>('free')

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()

        if (profile?.plan) {
          setPlan(profile.plan)
        }
      }
    }

    fetchPlan()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <nav className="bg-[#006B3C] text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold">InvoiceNaija</span>
          </div>
          <div className="flex space-x-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:text-[#FFB800] transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/clients')}
              className="hover:text-[#FFB800] transition-colors"
            >
              Clients
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {plan === 'premium' ? (
            <span className="bg-[#FFB800] text-[#006B3C] px-3 py-1 rounded-full text-sm font-bold">
              PREMIUM
            </span>
          ) : (
            <button
              onClick={() => router.push('/upgrade')}
              className="bg-[#FFB800] text-[#006B3C] px-4 py-2 rounded-lg font-medium hover:bg-[#e6a600] transition-colors"
            >
              Upgrade
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-[#FFB800] text-[#006B3C] px-4 py-2 rounded-lg font-medium hover:bg-[#e6a600] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
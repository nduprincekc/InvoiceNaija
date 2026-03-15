'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const nigerianBanks = [
  'GTBank',
  'Access Bank',
  'Zenith Bank',
  'UBA',
  'First Bank',
  'Fidelity Bank',
  'Sterling Bank',
  'Wema Bank',
  'Polaris Bank',
  'Kuda Bank',
  'Opay',
  'Moniepoint',
  'Ecobank',
  'Union Bank',
  'Stanbic IBTC',
  'FCMB',
  'Heritage Bank',
  'Keystone Bank',
  'Unity Bank',
  'Jaiz Bank',
  'Providus Bank',
  'SunTrust Bank'
]

interface Profile {
  business_name: string
  phone: string
  bank_name: string
  account_number: string
  account_name: string
  plan?: string
  logo_url?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (profileData) {
          setProfile(profileData)
          setBusinessName(profileData.business_name || '')
          setPhone(profileData.phone || '')
          setBankName(profileData.bank_name || '')
          setAccountNumber(profileData.account_number || '')
          setAccountName(profileData.account_name || '')
          setLogoPreview(profileData.logo_url || null)
          setExistingLogoUrl(profileData.logo_url || null)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let logo_url = existingLogoUrl

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const filePath = `${user.id}/logo.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, { upsert: true })
        
        if (!uploadError) {
          const { data } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath)
          logo_url = data.publicUrl
        }
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          business_name: businessName,
          phone: phone,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          logo_url: logo_url
        }, { onConflict: 'id' })

      if (error) throw error
      
      setSuccess('Profile updated successfully! ✅')
      setError('')
      setExistingLogoUrl(logo_url)
      setLogoFile(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Business Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3C] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                Business Logo
              </label>
              {profile?.plan === 'premium' ? (
                <>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3C] focus:border-transparent"
                  />
                  {logoPreview && (
                    <div className="mt-2">
                      <img src={logoPreview} alt="Logo preview" className="h-16 w-auto object-contain border rounded" />
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    Logo upload is a premium feature.{' '}
                    <a href="/upgrade" className="text-[#006B3C] font-medium hover:underline">
                      Upgrade to Premium
                    </a>{' '}
                    to add your business logo to invoices.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3C] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <select
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3C] focus:border-transparent"
                required
              >
                <option value="">Select a bank</option>
                {nigerianBanks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                id="accountNumber"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3C] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                id="accountName"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3C] focus:border-transparent"
                required
              />
            </div>

            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">{success}</div>
            )}

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006B3C] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#005a32] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
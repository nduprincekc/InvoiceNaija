'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface LineItem {
  description: string
  qty: number
  unitPrice: number
  total: number
}

interface Profile {
  business_name: string
  phone: string
  bank_name: string
  account_number: string
  account_name: string
  plan?: string
  logo_url?: string
}

export default function CreateInvoicePage() {
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', qty: 1, unitPrice: 0, total: 0 }
  ])
  const [vatEnabled, setVatEnabled] = useState(false)
  const [notes, setNotes] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001')
  const [showLimitModal, setShowLimitModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      } else {
        router.push('/setup')
      }

      // Generate invoice number
      const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', user.id)
        .order('invoice_number', { ascending: false })
        .limit(1)

      if (invoices && invoices.length > 0) {
        const lastNo = invoices[0].invoice_number
        const num = parseInt(lastNo.split('-')[1]) + 1
        setInvoiceNumber(`INV-${num.toString().padStart(3, '0')}`)
      }
    }
    checkAuth()
  }, [router])

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'qty' || field === 'unitPrice') {
      newItems[index].total = newItems[index].qty * newItems[index].unitPrice
    }
    setLineItems(newItems)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', qty: 1, unitPrice: 0, total: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const vatAmount = vatEnabled ? subtotal * 0.075 : 0
  const total = subtotal + vatAmount

  const handleSave = async (status: 'Draft' | 'Sent') => {
    if (!profile) return

    // Check invoice limit for free users
    if (profile.plan !== 'premium') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const { data: invoicesThisMonth, error: countError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)

      if (countError) {
        console.error('Error counting invoices:', countError)
      } else if (invoicesThisMonth && invoicesThisMonth.length >= 5) {
        setShowLimitModal(true)
        return
      }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          due_date: dueDate,
          line_items: lineItems.map(item => ({
            description: item.description,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total)
          })),
          subtotal: subtotal,
          vat_amount: vatAmount,
          total: total,
          status,
          notes
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/invoice/${data.id}`)
    } catch (err: any) {
      alert('Error saving invoice: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Invoice</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#006B3C] focus:border-[#006B3C]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Phone
                  </label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#006B3C] focus:border-[#006B3C]"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#006B3C] focus:border-[#006B3C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#006B3C] focus:border-[#006B3C]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Line Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-left py-2 w-20">Qty</th>
                      <th className="text-left py-2 w-24">Unit Price</th>
                      <th className="text-left py-2 w-24">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateLineItem(index, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            min="1"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="py-2">
                          <span className="px-2 py-1">₦{item.total.toLocaleString()}</span>
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => removeLineItem(index)}
                            className="text-red-600 hover:text-red-800"
                            disabled={lineItems.length === 1}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addLineItem}
                className="mt-4 bg-[#006B3C] text-white px-4 py-2 rounded-md hover:bg-[#005a32]"
              >
                Add Row
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">VAT (7.5%)</span>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={vatEnabled}
                    onChange={(e) => setVatEnabled(e.target.checked)}
                    className="mr-2"
                  />
                  Enable VAT
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#006B3C] focus:border-[#006B3C]"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleSave('Draft')}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSave('Sent')}
                disabled={loading}
                className="flex-1 bg-[#006B3C] text-white py-3 px-4 rounded-md hover:bg-[#005a32] disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </div>

          {/* Preview Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Invoice Preview</h2>
              <div className="border border-gray-300 p-6 bg-white">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-[#006B3C]">InvoiceNaija</h3>
                    <p className="text-sm text-gray-600">Professional Invoicing Made Easy</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-lg font-semibold">INVOICE</h4>
                    <p className="text-sm">#{invoiceNumber}</p>
                    <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm">Due: {dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>

                {/* Business Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h5 className="font-semibold mb-2">From:</h5>
                    <p className="text-sm">{profile.business_name}</p>
                    <p className="text-sm">{profile.phone}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">To:</h5>
                    <p className="text-sm">{clientName || 'Client Name'}</p>
                    <p className="text-sm">{clientPhone || 'Client Phone'}</p>
                    <p className="text-sm">{clientEmail || 'Client Email'}</p>
                  </div>
                </div>

                {/* Line Items */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2 w-20">Qty</th>
                      <th className="text-right py-2 w-24">Unit Price</th>
                      <th className="text-right py-2 w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.description || 'Item description'}</td>
                        <td className="text-right py-2">{item.qty}</td>
                        <td className="text-right py-2">₦{item.unitPrice.toLocaleString()}</td>
                        <td className="text-right py-2">₦{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-48">
                    <div className="flex justify-between py-1">
                      <span>Subtotal:</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    {vatEnabled && (
                      <div className="flex justify-between py-1">
                        <span>VAT (7.5%):</span>
                        <span>₦{vatAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 font-bold border-t pt-1">
                      <span>Total:</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-[#FFB800] p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Payment Details</h5>
                  <p className="text-sm">Bank: {profile.bank_name}</p>
                  <p className="text-sm">Account Name: {profile.account_name}</p>
                  <p className="text-sm">Account Number: {profile.account_number}</p>
                </div>

                {notes && (
                  <div className="mt-4">
                    <h5 className="font-semibold mb-2">Notes:</h5>
                    <p className="text-sm">{notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Free Plan Limit Reached</h3>
            <p className="text-gray-700 mb-6">
              You've reached your free limit of 5 invoices this month. Upgrade to Premium for unlimited invoices.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push('/upgrade')}
                className="flex-1 bg-[#FFB800] text-[#006B3C] px-4 py-2 rounded-lg font-bold hover:bg-[#e6a600] transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface LineItem {
  description: string
  qty: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_phone: string
  client_email: string
  due_date: string
  line_items: LineItem[]
  subtotal: number
  vat_amount: number
  total: number
  status: string
  notes: string
  created_at: string
  user_id: string
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

export default function PaymentPage() {
  const params = useParams()
  const id = params.id as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)

  useEffect(() => {
    const fetchInvoice = async () => {
      // Fetch invoice (no auth required for public payment page)
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

      if (invoiceError || !invoiceData) {
        setLoading(false)
        return
      }

      setInvoice(invoiceData)

      // Fetch profile using the user_id from invoice
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', invoiceData.user_id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    if (id) {
      fetchInvoice()
    }
  }, [id])

  const handlePaymentConfirmation = async () => {
    if (!invoice) return

    setConfirmingPayment(true)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', id)

      if (error) throw error

      setPaymentConfirmed(true)
      // Update local state
      setInvoice({ ...invoice, status: 'paid' })
    } catch (err: any) {
      alert('Error confirming payment: ' + err.message)
    } finally {
      setConfirmingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Invoice not found</div>
      </div>
    )
  }

  const subtotal = invoice.line_items.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#006B3C] mb-2">InvoiceNaija</h1>
            <p className="text-gray-600">Professional Invoicing Made Easy</p>
          </div>

          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-gray-600">#{invoice.invoice_number}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Payment Status */}
          {paymentConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-green-600 text-lg mr-2">✅</span>
                <div>
                  <p className="font-semibold text-green-800">Thank you!</p>
                  <p className="text-green-700">{profile.business_name} has been notified of your payment.</p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details - Prominently displayed */}
          <div className="bg-[#FFB800] border-2 border-[#FFB800] p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-4 text-[#006B3C] text-lg">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Bank:</span> {profile.bank_name}
              </div>
              <div>
                <span className="font-medium">Account Name:</span> {profile.account_name}
              </div>
              <div>
                <span className="font-medium">Account Number:</span> {profile.account_number}
              </div>
            </div>
          </div>

          {/* Business and Client Details */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="font-semibold mb-2">From:</h4>
              <p className="font-bold">{profile.business_name}</p>
              <p className="text-sm text-gray-600">Phone: {profile.phone}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">To:</h4>
              <p className="font-bold">{invoice.client_name}</p>
              <p className="text-sm text-gray-600">Phone: {invoice.client_phone}</p>
              <p className="text-sm text-gray-600">Email: {invoice.client_email}</p>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-6 border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-right w-20">Qty</th>
                <th className="border border-gray-300 px-4 py-2 text-right w-24">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.qty}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₦{item.unitPrice.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₦{item.total.toLocaleString()}</td>
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
              {invoice.vat_amount > 0 && (
                <div className="flex justify-between py-1">
                  <span>VAT (7.5%):</span>
                  <span>₦{invoice.vat_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-1 font-bold border-t pt-1 text-lg">
                <span>Total:</span>
                <span>₦{invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          {!paymentConfirmed && invoice.status !== 'paid' && (
            <div className="text-center mb-6">
              <button
                onClick={handlePaymentConfirmation}
                disabled={confirmingPayment}
                className="bg-[#006B3C] text-white px-8 py-4 rounded-lg hover:bg-[#005a32] disabled:opacity-50 text-lg font-semibold"
              >
                {confirmingPayment ? 'Confirming Payment...' : "I've Made Payment"}
              </button>
            </div>
          )}

          {/* View Full Invoice Link */}
          <div className="text-center">
            <Link
              href={`/invoice/${id}`}
              className="text-[#006B3C] hover:text-[#005a32] underline"
            >
              View this invoice
            </Link>
          </div>

          {invoice.notes && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-2">Notes:</h4>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
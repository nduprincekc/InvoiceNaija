'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import jsPDF from 'jspdf'

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

export default function InvoiceViewPage() {
  const params = useParams()
  const id = params.id as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPaid, setIsPaid] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchInvoice = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (invoiceError || !invoiceData) {
        router.push('/dashboard')
        return
      }

      setInvoice(invoiceData)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    if (id) {
      fetchInvoice()
    }
  }, [id, router])

  useEffect(() => {
    if (invoice) {
      setIsPaid(invoice.status === 'paid')
    }
  }, [invoice])

  const generatePDF = () => {
    if (!invoice || !profile) return

    const doc = new jsPDF()
    let y = 20

    // Header
    doc.setFontSize(20)
    if (profile.logo_url && profile.plan === 'premium') {
      doc.text(profile.business_name, 20, y)
    } else {
      doc.text('InvoiceNaija', 20, y)
    }
    doc.setFontSize(12)
    doc.text('Professional Invoicing Made Easy', 20, y + 10)

    doc.setFontSize(16)
    doc.text('INVOICE', 150, y)
    doc.setFontSize(12)
    doc.text(`#${invoice.invoice_number}`, 150, y + 10)
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 150, y + 20)
    doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString()}`, 150, y + 30)

    y += 50

    // Business Details
    doc.text('From:', 20, y)
    doc.setFontSize(10)
    doc.text(profile.business_name, 20, y + 10)
    doc.text(profile.phone, 20, y + 20)

    doc.setFontSize(12)
    doc.text('To:', 120, y)
    doc.setFontSize(10)
    doc.text(invoice.client_name, 120, y + 10)
    doc.text(invoice.client_phone, 120, y + 20)
    doc.text(invoice.client_email, 120, y + 30)

    y += 50

    // Line Items
    doc.setFontSize(12)
    doc.text('Description', 20, y)
    doc.text('Qty', 120, y)
    doc.text('Unit Price', 140, y)
    doc.text('Total', 170, y)

    y += 10
    doc.line(20, y, 190, y)
    y += 10

    invoice.line_items.forEach(item => {
      doc.setFontSize(10)
      doc.text(item.description || 'Item', 20, y)
      doc.text(item.qty.toString(), 120, y)
      doc.text(`₦${item.unitPrice.toLocaleString()}`, 140, y)
      doc.text(`₦${item.total.toLocaleString()}`, 170, y)
      y += 10
    })

    y += 10

    // Totals
    const subtotal = invoice.line_items.reduce((sum, item) => sum + item.total, 0)
    doc.setFontSize(12)
    doc.text(`Subtotal: ₦${subtotal.toLocaleString()}`, 140, y)
    y += 10
    if (invoice.vat_amount > 0) {
      doc.text(`VAT (7.5%): ₦${invoice.vat_amount.toLocaleString()}`, 140, y)
      y += 10
    }
    doc.setFont('helvetica', 'bold')
    doc.text(`Total: ₦${invoice.total.toLocaleString()}`, 140, y)

    y += 20

    // Bank Details
    doc.setFillColor(255, 184, 0) // Gold
    doc.rect(20, y, 170, 40, 'F')
    doc.setTextColor(0, 107, 60) // Green
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Details', 25, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Bank: ${profile.bank_name}`, 25, y + 20)
    doc.text(`Account Name: ${profile.account_name}`, 25, y + 30)
    doc.text(`Account Number: ${profile.account_number}`, 25, y + 40)

    if (invoice.notes) {
      y += 60
      doc.setTextColor(0)
      doc.setFontSize(12)
      doc.text('Notes:', 20, y)
      doc.setFontSize(10)
      const splitNotes = doc.splitTextToSize(invoice.notes, 170)
      doc.text(splitNotes, 20, y + 10)
    }

    doc.save(`invoice-${invoice.invoice_number}.pdf`)
  }

  const shareWhatsApp = () => {
    if (!invoice || !profile) return

    const message = `Hi ${invoice.client_name}, please find your invoice #${invoice.invoice_number} from ${profile.business_name}.

Amount Due: ₦${invoice.total.toLocaleString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Payment Details:
Bank: ${profile.bank_name}
Account: ${profile.account_number}
Name: ${profile.account_name}

Thank you 🙏`

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const markAsPaid = async () => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', id)

      if (error) throw error

      setIsPaid(true)
      // Update the invoice state
      if (invoice) {
        setInvoice({ ...invoice, status: 'paid' })
      }
    } catch (err: any) {
      alert('Error updating invoice status: ' + err.message)
    }
  }

  const sendEmail = async () => {
    if (!invoice) return

    setSendingEmail(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ invoiceId: id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email')
      }

      alert(`Invoice sent to ${invoice.client_email}! ✅`)
    } catch (err: any) {
      alert('Error sending email: ' + err.message)
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading invoice...</div>
        </div>
      </div>
    )
  }

  if (!invoice || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Invoice not found</div>
        </div>
      </div>
    )
  }

  const subtotal = invoice.line_items.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.invoice_number}</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={generatePDF}
              className="bg-[#006B3C] text-white px-4 py-2 rounded-md hover:bg-[#005a32]"
            >
              Download PDF
            </button>
            <button
              onClick={shareWhatsApp}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              📱 WhatsApp
            </button>
            <button
              onClick={sendEmail}
              disabled={sendingEmail}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingEmail ? 'Sending...' : '📧 Send Email'}
            </button>
            <button
              onClick={markAsPaid}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Mark as Paid
            </button>
        </div></div>

        <div className="bg-white p-8 rounded-lg shadow-sm border">
          {/* Header */}
          <div className="flex justify-between items-start mb-12 pb-6 border-b-2 border-gray-300">
            <div>
              {profile?.logo_url && profile?.plan === 'premium' ? (
                <div className="flex items-center gap-4">
                  <img
                    src={profile.logo_url}
                    alt={`${profile.business_name} logo`}
                    className="h-12 w-auto object-contain"
                  />
                  <div>
                    <h3 className="text-3xl font-bold text-[#006B3C]">{profile.business_name}</h3>
                    <p className="text-sm text-gray-600">Professional Invoicing Made Easy</p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-3xl font-bold text-[#006B3C]">InvoiceNaija</h3>
                  <p className="text-sm text-gray-600">Professional Invoicing Made Easy</p>
                </>
              )}
            </div>
            <div className="text-right">
              <h4 className="text-xl font-semibold">INVOICE</h4>
              <p className="text-sm">#{invoice.invoice_number}</p>
              <p className="text-sm">Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
              <p className="text-sm">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                invoice.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-100 border border-gray-300 p-6 rounded-lg">
              <h5 className="font-semibold mb-4 text-gray-800">FROM:</h5>
              <p className="text-lg font-bold text-gray-900 mb-2">{profile.business_name}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Phone:</span> {profile.phone}</p>
            </div>
            <div className="bg-gray-100 border border-gray-300 p-6 rounded-lg">
              <h5 className="font-semibold mb-4 text-gray-800">TO:</h5>
              <p className="text-lg font-bold text-gray-900 mb-2">{invoice.client_name}</p>
              <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Phone:</span> {invoice.client_phone}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Email:</span> {invoice.client_email}</p>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-8 border-collapse border border-gray-300">
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
          <div className="flex justify-end mb-12">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal:</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              {invoice.vat_amount > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span>VAT (7.5%):</span>
                  <span>₦{invoice.vat_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg">
                <span>Total:</span>
                <span>₦{invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border-2 border-[#FFB800] p-6 rounded-lg mb-6">
            <h5 className="font-semibold mb-4 text-[#006B3C]">Payment Details</h5>
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

          {invoice.notes && (
            <div>
              <h5 className="font-semibold mb-2">Notes:</h5>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
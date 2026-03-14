'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  due_date: string
  total: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoice_number: 'INV-001',
    client_name: 'ABC Corp',
    total: 50000,
    due_date: '2024-03-20',
    status: 'Paid'
  },
  {
    id: '2',
    invoice_number: 'INV-002',
    client_name: 'XYZ Ltd',
    total: 75000,
    due_date: '2024-03-15',
    status: 'Sent'
  },
  {
    id: '3',
    invoice_number: 'INV-003',
    client_name: 'Tech Solutions',
    total: 100000,
    due_date: '2024-03-10',
    status: 'Overdue'
  }
]

const statusColors = {
  Draft: 'bg-gray-100 text-gray-800',
  Sent: 'bg-blue-100 text-blue-800',
  Paid: 'bg-green-100 text-green-800',
  Overdue: 'bg-red-100 text-red-800'
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (invoicesData) {
        setInvoices(invoicesData)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInstalled = localStorage.getItem('invoiceNaija-installed') === 'true'

    if (!isStandalone && !isInstalled) {
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowInstallBanner(true)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        localStorage.setItem('invoiceNaija-installed', 'true')
        setShowInstallBanner(false)
      }

      setDeferredPrompt(null)
    }
  }

  const dismissBanner = () => {
    localStorage.setItem('invoiceNaija-installed', 'true')
    setShowInstallBanner(false)
  }

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const amountPaid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0)
  const amountPending = invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.total, 0)
  const invoiceCount = invoices.length

  const handleView = (id: string) => {
    router.push(`/invoice/${id}`)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (!error) {
        setInvoices(invoices.filter(inv => inv.id !== id))
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="bg-[#FFB800] text-[#006B3C] px-4 py-3 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📱</span>
              <p className="font-medium">
                Add InvoiceNaija to your home screen for quick access!
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstall}
                className="bg-[#006B3C] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#005a32] transition-colors"
              >
                Install
              </button>
              <button
                onClick={dismissBanner}
                className="text-[#006B3C] hover:text-[#004d26] p-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-[#006B3C] rounded-lg">
                <span className="text-white text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoiced This Month</p>
                <p className="text-2xl font-bold text-gray-900">₦{totalInvoiced.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <span className="text-white text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                <p className="text-2xl font-bold text-gray-900">₦{amountPaid.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <span className="text-white text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Amount Pending</p>
                <p className="text-2xl font-bold text-gray-900">₦{amountPending.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-[#FFB800] rounded-lg">
                <span className="text-white text-xl">📄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Invoice Count</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₦{invoice.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleView(invoice.id)}
                        className="text-[#006B3C] hover:text-[#005a32] mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/create')}
        className="fixed bottom-6 right-6 bg-[#006B3C] text-white w-14 h-14 rounded-full shadow-lg hover:bg-[#005a32] flex items-center justify-center text-2xl"
      >
        ➕
      </button>
    </div>
  )
}
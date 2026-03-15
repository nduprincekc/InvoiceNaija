'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  due_date: string
  total: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'
  created_at: string
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoice_number: 'INV-001',
    client_name: 'ABC Corp',
    total: 50000,
    due_date: '2024-03-20',
    status: 'Paid',
    created_at: '2024-03-15T10:00:00Z'
  },
  {
    id: '2',
    invoice_number: 'INV-002',
    client_name: 'XYZ Ltd',
    total: 75000,
    due_date: '2024-03-15',
    status: 'Sent',
    created_at: '2024-03-14T10:00:00Z'
  },
  {
    id: '3',
    invoice_number: 'INV-003',
    client_name: 'Ojon Tech',
    total: 50000,
    due_date: '2024-03-10',
    status: 'Paid',
    created_at: '2024-03-13T10:00:00Z'
  },
  {
    id: '4',
    invoice_number: 'INV-004',
    client_name: 'TOCHUKWU',
    total: 0,
    due_date: '2024-03-12',
    status: 'Draft',
    created_at: '2024-03-12T10:00:00Z'
  },
  {
    id: '5',
    invoice_number: 'INV-001', // Duplicate invoice number - should be filtered out
    client_name: 'ABC Corp',
    total: 45000,
    due_date: '2024-03-20',
    status: 'Draft',
    created_at: '2024-03-10T08:00:00Z'
  },
  {
    id: '6',
    invoice_number: 'INV-005',
    client_name: 'Tech Startup',
    total: 120000,
    due_date: '2024-03-25',
    status: 'Sent',
    created_at: '2024-03-16T14:00:00Z'
  },
  {
    id: '7',
    invoice_number: 'INV-006',
    client_name: 'Design Agency',
    total: 85000,
    due_date: '2024-03-18',
    status: 'Overdue',
    created_at: '2024-03-11T09:00:00Z'
  },
  {
    id: '8',
    invoice_number: 'INV-002', // Duplicate - should be filtered out
    client_name: 'XYZ Ltd',
    total: 70000,
    due_date: '2024-03-15',
    status: 'Draft',
    created_at: '2024-03-09T12:00:00Z'
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
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Fetch invoices - deduplicate by invoice_number, keep most recent, limit to 10
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (invoicesData) {
        // Deduplicate by invoice_number, keeping only the most recent one by created_at
        const uniqueInvoices = new Map<string, Invoice>()
        invoicesData.forEach(invoice => {
          const existing = uniqueInvoices.get(invoice.invoice_number)
          if (!existing || new Date(invoice.created_at) > new Date(existing.created_at)) {
            uniqueInvoices.set(invoice.invoice_number, invoice)
          }
        })

        // Convert back to array, limit to 10, and sort by created_at descending
        const deduplicatedInvoices: Invoice[] = (Array.from(uniqueInvoices.values()) as Invoice[])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)

        setInvoices(deduplicatedInvoices)
      }
    }
    checkAuth()
  }, [router])

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const amountPaid = invoices.filter(inv => inv.status.toLowerCase() === 'paid').reduce((sum, inv) => sum + inv.total, 0)
  const amountPending = invoices.filter(inv => inv.status.toLowerCase() !== 'paid').reduce((sum, inv) => sum + inv.total, 0)
  const invoiceCount = invoices.length

  // Prepare chart data
  const getMonthlyIncomeData = () => {
    const last6Months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.created_at)
        return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear()
      })
      const total = monthInvoices.reduce((sum, inv) => sum + inv.total, 0)
      last6Months.push({
        month: monthName,
        amount: total,
        isCurrentMonth: i === 0
      })
    }
    return last6Months
  }

  const getPaymentStatusData = () => {
    return [
      { name: 'Paid', value: amountPaid, color: '#006B3C' },
      { name: 'Pending', value: amountPending, color: '#dc2626' }
    ]
  }

  const getTopClientsData = () => {
    const clientTotals = invoices.reduce((acc, inv) => {
      acc[inv.client_name] = (acc[inv.client_name] || 0) + inv.total
      return acc
    }, {} as Record<string, number>)

    return Object.entries(clientTotals)
      .filter(([, total]) => total > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }))
  }

  const monthlyIncomeData = getMonthlyIncomeData()
  const paymentStatusData = getPaymentStatusData()
  const topClientsData = getTopClientsData()

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

        {/* Income Dashboard Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Income Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income This Year</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyIncomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => [`₦${(value as number).toLocaleString()}`, 'Amount']}
                  labelStyle={{ color: '#000' }}
                />
                <Bar
                  dataKey="amount"
                  fill="#006B3C"
                >
                  {monthlyIncomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isCurrentMonth ? '#FFB800' : '#006B3C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Status Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `₦${(value as number).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h3>
          <div className="space-y-4">
            {topClientsData.map((client, index) => {
              const maxAmount = topClientsData[0]?.total || 1
              const percentage = (client.total / maxAmount) * 100
              return (
                <div key={client.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-6">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900">{client.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#006B3C] h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
                      ₦{client.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[invoice.status as keyof typeof statusColors] || 
                        (invoice.status.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).toLowerCase()}
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
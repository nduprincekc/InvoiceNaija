'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Client {
  name: string
  phone: string
  email: string
  totalInvoiced: number
  invoiceCount: number
  invoices: Invoice[]
}

interface Invoice {
  id: string
  invoice_number: string
  total: number
  status: string
  due_date: string
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      await fetchClients(user.id)
    }

    checkAuth()
  }, [router])

  const fetchClients = async (userId: string) => {
    try {
      // Fetch all invoices for this user
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('client_name, client_phone, client_email, total, id, invoice_number, status, due_date, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group invoices by client
      const clientMap = new Map<string, Client>()

      invoices.forEach((invoice: any) => {
        const key = `${invoice.client_name}-${invoice.client_phone}-${invoice.client_email}`

        if (!clientMap.has(key)) {
          clientMap.set(key, {
            name: invoice.client_name,
            phone: invoice.client_phone,
            email: invoice.client_email,
            totalInvoiced: 0,
            invoiceCount: 0,
            invoices: []
          })
        }

        const client = clientMap.get(key)!
        client.totalInvoiced += invoice.total
        client.invoiceCount += 1
        client.invoices.push({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total: invoice.total,
          status: invoice.status,
          due_date: invoice.due_date,
          created_at: invoice.created_at
        })
      })

      setClients(Array.from(clientMap.values()))
      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching clients:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading clients...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Address Book</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#006B3C] text-white px-4 py-2 rounded-md hover:bg-[#005a32]"
          >
            Back to Dashboard
          </button>
        </div>

        {selectedClient ? (
          // Client details view
          <div>
            <button
              onClick={() => setSelectedClient(null)}
              className="mb-6 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              ← Back to Clients
            </button>

            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h2 className="text-2xl font-bold mb-4">{selectedClient.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Phone:</span> {selectedClient.phone}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedClient.email}
                </div>
                <div>
                  <span className="font-medium">Total Invoiced:</span> ₦{selectedClient.totalInvoiced.toLocaleString()}
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4">Invoice History ({selectedClient.invoices.length})</h3>
            <div className="grid gap-4">
              {selectedClient.invoices.map((invoice) => (
                <div key={invoice.id} className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">#{invoice.invoice_number}</h4>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₦{invoice.total.toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded text-xs ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => router.push(`/invoice/${invoice.id}`)}
                      className="text-[#006B3C] hover:text-[#005a32] underline text-sm"
                    >
                      View Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Clients list view
          <div>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No clients found. Create your first invoice to see clients here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((client, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <h3 className="text-xl font-semibold mb-3">{client.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Phone:</span> {client.phone}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {client.email}
                      </div>
                      <div>
                        <span className="font-medium">Invoices:</span> {client.invoiceCount}
                      </div>
                      <div>
                        <span className="font-medium">Total Invoiced:</span> ₦{client.totalInvoiced.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Get authenticated user to verify they are logged in
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoice using admin client (bypasses RLS)
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch profile using admin client (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Generate HTML email template
    const htmlContent = generateInvoiceEmailHTML(invoice as Invoice, profile as Profile)

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'InvoiceNaija <noreply@yourdomain.com>', // Replace with your verified domain
      to: invoice.client_email,
      subject: `Invoice ${invoice.invoice_number} from ${profile.business_name}`,
      html: htmlContent,
    })

    if (error) {
      console.error('Email send error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: data?.id })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateInvoiceEmailHTML(invoice: Invoice, profile: Profile): string {
  const subtotal = invoice.line_items.reduce((sum, item) => sum + item.total, 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; }
        .header { text-align: center; border-bottom: 2px solid #006B3C; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #006B3C; margin: 0; font-size: 28px; }
        .header p { color: #666; margin: 5px 0; }
        .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .detail-box { flex: 1; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .detail-box h3 { margin: 0 0 10px 0; color: #333; font-size: 16px; }
        .detail-box p { margin: 5px 0; color: #666; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        .table th { background-color: #f5f5f5; font-weight: bold; }
        .totals { margin-top: 20px; }
        .total-row { display: flex; justify-content: flex-end; margin: 5px 0; }
        .total-row span:first-child { flex: 1; }
        .total-row.total { font-weight: bold; font-size: 18px; }
        .payment-details { background-color: #FFB800; padding: 20px; border-radius: 5px; margin-top: 30px; }
        .payment-details h3 { margin: 0 0 15px 0; color: #006B3C; }
        .payment-details p { margin: 5px 0; color: #333; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${profile.logo_url && profile.plan === 'premium' ?
            `<div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
              <img src="${profile.logo_url}" alt="${profile.business_name} logo" style="height: 60px; width: auto; object-fit: contain;" />
              <div>
                <h1 style="margin: 0; font-size: 28px;">${profile.business_name}</h1>
                <p style="margin: 5px 0; color: #666;">Professional Invoicing Made Easy</p>
              </div>
            </div>` :
            `<h1>InvoiceNaija</h1>
            <p>Professional Invoicing Made Easy</p>`
          }
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #006B3C; margin: 0;">INVOICE</h2>
          <p style="font-size: 18px; margin: 5px 0;">#${invoice.invoice_number}</p>
          <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
          <p>Due: ${new Date(invoice.due_date).toLocaleDateString()}</p>
        </div>

        <div class="details">
          <div class="detail-box">
            <h3>FROM:</h3>
            <p style="font-size: 18px; font-weight: bold; color: #006B3C;">${profile.business_name}</p>
            <p>Phone: ${profile.phone}</p>
          </div>
          <div class="detail-box" style="margin-left: 20px;">
            <h3>TO:</h3>
            <p style="font-size: 18px; font-weight: bold; color: #333;">${invoice.client_name}</p>
            <p>Phone: ${invoice.client_phone}</p>
            <p>Email: ${invoice.client_email}</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.line_items.map(item => `
              <tr>
                <td>${item.description || 'Item'}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">₦${item.unitPrice.toLocaleString()}</td>
                <td style="text-align: right;">₦${item.total.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₦${subtotal.toLocaleString()}</span>
          </div>
          ${invoice.vat_amount > 0 ? `
            <div class="total-row">
              <span>VAT (7.5%):</span>
              <span>₦${invoice.vat_amount.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="total-row total">
            <span>Total:</span>
            <span>₦${invoice.total.toLocaleString()}</span>
          </div>
        </div>

        <div class="payment-details">
          <h3>Payment Details</h3>
          <p><strong>Bank:</strong> ${profile.bank_name}</p>
          <p><strong>Account Name:</strong> ${profile.account_name}</p>
          <p><strong>Account Number:</strong> ${profile.account_number}</p>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 30px;">
            <h3 style="color: #333; margin-bottom: 10px;">Notes:</h3>
            <p style="color: #666;">${invoice.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business! 🙏</p>
          <p>Generated by InvoiceNaija</p>
        </div>
      </div>
    </body>
    </html>
  `
}
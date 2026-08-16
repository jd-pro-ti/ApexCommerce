import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  tls: { rejectUnauthorized: false },
})

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]))

export async function sendSellerEmail({ to, subject, title, message, actionPath = '/perfil' }) {
  if (!to || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return { success: false, skipped: true }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    await transporter.sendMail({
      from: `"Apex Commerce" <${process.env.GMAIL_USER}>`, to, subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#162536"><div style="background:#162536;padding:28px;text-align:center;color:white"><h1>Apex <span style="color:#FFB872">Commerce</span></h1></div><div style="padding:30px"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><a href="${appUrl}${actionPath}" style="display:inline-block;background:#FFB872;color:#162536;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Abrir Apex Commerce</a></div></div>`,
    })
    return { success: true }
  } catch (error) {
    console.error('No se pudo enviar correo de solicitud de vendedor:', error.message)
    return { success: false, error: error.message }
  }
}

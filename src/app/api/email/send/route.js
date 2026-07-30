import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

// Configurar transporter de Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
})

// Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error al conectar con Gmail SMTP:', error)
  } else {
    console.log('✅ Conexión con Gmail SMTP establecida correctamente')
  }
})

export async function POST(request) {
  try {
    const { to, subject, html, from } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const mailOptions = {
      from: from || `"Apex Commerce" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email enviado:', info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    })
  } catch (error) {
    console.error('❌ Error al enviar email:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
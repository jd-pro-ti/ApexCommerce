import { authService } from '@/services/authService'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const result = await authService.logout()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Sesión cerrada exitosamente'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}
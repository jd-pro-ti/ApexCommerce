import { authService } from '@/services/authService'
import { NextResponse } from 'next/server'
import { getAge, validateEmail, validatePassword } from '@/utils/validation'

export async function POST(request) {
  try {
    const { email, password, name, role, birth_date } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, error: 'El correo electrónico no tiene un formato válido' }, { status: 400 })
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    if (birth_date) {
      const age = getAge(birth_date)
      if (age === null || age < 12) return NextResponse.json({ success: false, error: 'Debes tener al menos 12 años para crear una cuenta' }, { status: 400 })
    }

    const result = await authService.register(email, password, { name, role, birth_date })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      user: result.user,
      message: 'Usuario registrado exitosamente'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}

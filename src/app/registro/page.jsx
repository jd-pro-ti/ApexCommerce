'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function RegistroPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El correo electrónico es requerido');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Correo electrónico inválido');
      return false;
    }
    if (!formData.password) {
      setError('La contraseña es requerida');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Siempre registrar como cliente
      const result = await register(
        formData.email,
        formData.password,
        {
          name: formData.name,
          role: 'cliente' // Rol fijo
        }
      );
      
      if (result.success) {
        setSuccess(true);
        // Esperar 2 segundos y redirigir al dashboard de cliente
        setTimeout(() => {
          router.push('/dashboard/cliente');
        }, 2000);
      } else {
        setError(result.error || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError('Error al registrar usuario. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error || 'Error al registrar con Google');
        setLoading(false);
      }
      // La redirección es manejada por el callback
    } catch (error) {
      setError('Error al registrar con Google');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50">
        <Card className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Registro exitoso!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido creada correctamente. Serás redirigido a tu dashboard de cliente.
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Redirigiendo...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Crear Cuenta</h2>
          <p className="text-gray-600 mt-2">Únete a APEX Commerce como cliente</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nombre completo"
            placeholder="Juan Pérez"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />

          {/* Mensaje informativo en lugar de selector de rol */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              📝 Te registrarás como <strong>Cliente</strong>. 
              Podrás comprar productos y gestionar tus pedidos.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
          >
            Registrarse como Cliente
          </Button>
        </form>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">O registrate con</span>
          </div>
        </div>

        {/* Redes Sociales */}
        <Button
          variant="outline"
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.598 1.237 6.39l4.029 3.375z"/>
            <path fill="#34A853" d="M16.218 18.5A7.077 7.077 0 0 1 12 21.09c-3.282 0-6.073-1.282-8.174-3.364l-3.98 3.98C3.198 21.402 7.27 24 12 24c3.055 0 5.782-1.145 7.91-3l-3.692-2.5z"/>
            <path fill="#4A90E2" d="M21.5 12.5c0-.709-.064-1.4-.182-2.09H12v4.09h5.964c-.282 1.5-1.036 2.727-2.1 3.546l3.31 2.3C20.218 19.7 21.5 16.2 21.5 12.5z"/>
            <path fill="#FBBC05" d="M5.266 14.235A7.077 7.077 0 0 1 4.909 12c0-.773.136-1.5.357-2.235L1.237 6.39C.436 8.018 0 9.91 0 12c0 2.09.436 3.982 1.237 5.61l4.029-3.375z"/>
          </svg>
          Google
        </Button>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Inicia sesión aquí
          </Link>
        </p>
      </Card>
    </div>
  );
}
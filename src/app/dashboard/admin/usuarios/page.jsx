'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await authService.getAllUsers();
      if (result.success) {
        setUsers(result.users);
      } else {
        setError(result.error || 'Error al cargar usuarios');
      }
    } catch (error) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const result = await authService.updateUserRole(userId, newRole);
      if (result.success) {
        setSuccess('Rol actualizado correctamente');
        await loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Error al actualizar rol');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Error al actualizar rol');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const result = await authService.updateUserStatus(userId, newStatus);
      if (result.success) {
        setSuccess(`Usuario ${newStatus === 'active' ? 'activado' : 'suspendido'} correctamente`);
        await loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Error al actualizar estado');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Error al actualizar estado');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await authService.deleteUser(userId);
      if (result.success) {
        setSuccess('Usuario eliminado correctamente');
        await loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Error al eliminar usuario');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Error al eliminar usuario');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'vendedor':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-700';
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra los usuarios de la plataforma</p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm">
          🔄 Refrescar
        </Button>
      </div>

      {/* Mensajes de éxito/error */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon="🔍"
          className="max-w-md"
        />
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Usuario</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rol</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getRoleBadgeColor(user.role)}`}
                        disabled={user.id === currentUser?.id}
                      >
                        <option value="admin">Admin</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="cliente">Cliente</option>
                      </select>
                      {user.id === currentUser?.id && (
                        <span className="text-xs text-gray-400 ml-1">(tú)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.status || 'active'}
                        onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getStatusBadgeColor(user.status || 'active')}`}
                        disabled={user.id === currentUser?.id}
                      >
                        <option value="active">Activo</option>
                        <option value="suspended">Suspendido</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModal(true);
                          }}
                        >
                          👁️ Ver
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            🗑️
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-600">
          <span>Total: {filteredUsers.length} usuarios</span>
          <span>
            👑 {users.filter(u => u.role === 'admin').length} admins | 
            🏪 {users.filter(u => u.role === 'vendedor').length} vendedores | 
            🛒 {users.filter(u => u.role === 'cliente').length} clientes
          </span>
        </div>
      </Card>

      {/* Modal de detalles del usuario */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Detalles del Usuario</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl text-blue-600 font-bold">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Rol</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Estado</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedUser.status || 'active')}`}>
                      {selectedUser.status || 'active'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Creado</label>
                    <p className="text-gray-900">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Última actualización</label>
                    <p className="text-gray-900">
                      {new Date(selectedUser.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold mb-2">Acciones rápidas</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleUpdateStatus(selectedUser.id, 'active');
                        setShowModal(false);
                      }}
                      disabled={selectedUser.status === 'active' || selectedUser.id === currentUser?.id}
                    >
                      ✅ Activar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        handleUpdateStatus(selectedUser.id, 'suspended');
                        setShowModal(false);
                      }}
                      disabled={selectedUser.status === 'suspended' || selectedUser.id === currentUser?.id}
                    >
                      ⛔ Suspender
                    </Button>
                    {selectedUser.id !== currentUser?.id && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm('¿Eliminar este usuario?')) {
                            handleDeleteUser(selectedUser.id);
                            setShowModal(false);
                          }
                        }}
                      >
                        🗑️ Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
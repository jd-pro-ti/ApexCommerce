'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Users, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  Store, 
  ShoppingBag, 
  Eye, 
  Trash2, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Crown,
  UserCheck,
  UserX,
  X
} from 'lucide-react';

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

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-600 border border-red-200';
      case 'vendedor':
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    }
  };

  const getStatusBadgeStyle = (status) => {
    return status === 'active' 
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
      : 'bg-gray-50 text-gray-600 border border-gray-200';
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f1f3f6]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-12 font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de la sección */}
        <div className="mb-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dd9448]/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#010f20] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Gestión de Usuarios
            </h1>
            <p className="text-xs sm:text-sm text-[#44474c] mt-1">
              Administra los permisos, estados y accesos de los usuarios en la plataforma.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
            <Button 
              onClick={loadUsers} 
              variant="outline" 
              className="w-full md:w-auto border border-[#efedef] hover:border-[#010f20] text-[#010f20] text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refrescar
            </Button>
          </div>
        </div>

        {/* Mensajes de éxito / error */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Barra de Búsqueda */}
        <div className="mb-6 bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-[#efedef]">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#44474c]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#fdfdfd] border border-[#efedef] rounded-2xl text-xs font-semibold text-[#010f20] focus:outline-none focus:border-[#010f20] transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#efedef]">
                  <th className="py-4 px-4 text-[11px] font-extrabold text-[#44474c] uppercase tracking-wider">Usuario</th>
                  <th className="py-4 px-4 text-[11px] font-extrabold text-[#44474c] uppercase tracking-wider">Email</th>
                  <th className="py-4 px-4 text-[11px] font-extrabold text-[#44474c] uppercase tracking-wider">Rol</th>
                  <th className="py-4 px-4 text-[11px] font-extrabold text-[#44474c] uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-4 text-[11px] font-extrabold text-[#44474c] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efedef]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-xs text-[#44474c] font-semibold">
                      No se encontraron usuarios registrados
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#fdfdfd] transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-xs shadow-sm">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <span className="font-extrabold text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-[#44474c]">{user.email}</td>
                      <td className="py-4 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-[#efedef] focus:outline-none focus:border-[#010f20] transition-colors cursor-pointer ${getRoleBadgeStyle(user.role)}`}
                          disabled={user.id === currentUser?.id}
                        >
                          <option value="admin">Admin</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="cliente">Cliente</option>
                        </select>
                        {user.id === currentUser?.id && (
                          <span className="text-[10px] text-[#44474c] ml-1 font-semibold">(tú)</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={user.status || 'active'}
                          onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-[#efedef] focus:outline-none focus:border-[#010f20] transition-colors cursor-pointer ${getStatusBadgeStyle(user.status || 'active')}`}
                          disabled={user.id === currentUser?.id}
                        >
                          <option value="active">Activo</option>
                          <option value="suspended">Suspendido</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowModal(true);
                            }}
                            className="p-2 bg-[#f1f3f6] hover:bg-[#010f20] hover:text-white rounded-xl text-[#010f20] text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                            title="Ver detalles"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                            className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                            title="Eliminar cuenta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen inferior */}
          <div className="mt-6 pt-4 border-t border-[#efedef] flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#44474c] font-semibold">
            <span>Total: <strong className="text-[#010f20]">{filteredUsers.length}</strong> usuarios</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-red-500" /> {users.filter(u => u.role === 'admin').length} admins</span>
              <span className="flex items-center gap-1"><Store className="w-3.5 h-3.5 text-blue-500" /> {users.filter(u => u.role === 'vendedor').length} vendedores</span>
              <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5 text-emerald-500" /> {users.filter(u => u.role === 'cliente').length} clientes</span>
            </div>
          </div>
        </div>

        {/* Modal de Detalles del Usuario */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-[#010f20]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#efedef] p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Detalles del Usuario
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-[#f1f3f6] hover:bg-[#010f20] hover:text-white flex items-center justify-center text-[#010f20] text-xs font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[#fdfdfd] rounded-2xl border border-[#efedef]">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl text-blue-600 font-extrabold shadow-sm">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      {selectedUser.name}
                    </h4>
                    <p className="text-xs text-[#44474c] mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#fdfdfd] rounded-2xl border border-[#efedef]">
                    <span className="text-[10px] font-bold text-[#44474c] uppercase tracking-wider block mb-1">Rol actual</span>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${getRoleBadgeStyle(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div className="p-4 bg-[#fdfdfd] rounded-2xl border border-[#efedef]">
                    <span className="text-[10px] font-bold text-[#44474c] uppercase tracking-wider block mb-1">Estado</span>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${getStatusBadgeStyle(selectedUser.status || 'active')}`}>
                      {selectedUser.status || 'active'}
                    </span>
                  </div>
                  <div className="p-4 bg-[#fdfdfd] rounded-2xl border border-[#efedef]">
                    <span className="text-[10px] font-bold text-[#44474c] uppercase tracking-wider block mb-1">Creado</span>
                    <p className="text-xs font-bold text-[#010f20]">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-[#fdfdfd] rounded-2xl border border-[#efedef]">
                    <span className="text-[10px] font-bold text-[#44474c] uppercase tracking-wider block mb-1">Actualizado</span>
                    <p className="text-xs font-bold text-[#010f20]">
                      {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#efedef]">
                  <h4 className="text-xs font-extrabold text-[#010f20] uppercase tracking-wider mb-3">Acciones rápidas</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleUpdateStatus(selectedUser.id, 'active');
                        setShowModal(false);
                      }}
                      disabled={selectedUser.status === 'active' || selectedUser.id === currentUser?.id}
                      className="border border-[#efedef] hover:border-emerald-600 text-emerald-600 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Activar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        handleUpdateStatus(selectedUser.id, 'suspended');
                        setShowModal(false);
                      }}
                      disabled={selectedUser.status === 'suspended' || selectedUser.id === currentUser?.id}
                      className="bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" /> Suspender
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

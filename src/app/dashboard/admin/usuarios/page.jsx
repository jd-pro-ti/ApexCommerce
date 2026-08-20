'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/components/ui/AlertContext';
import { authService } from '@/services/authService';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Store, 
  ShoppingBag, 
  Eye, 
  Trash2, 
  Crown,
  UserCheck,
  UserX,
  X,
  ShieldAlert,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const { showAlert } = useAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await authService.getAllUsers();
      if (result.success) {
        setUsers(result.users || []);
      } else {
        showAlert(result.error || 'Error al cargar usuarios', 'error');
      }
    } catch (error) {
      showAlert('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const result = await authService.updateUserRole(userId, newRole);
      if (result.success) {
        showAlert('Rol actualizado correctamente', 'success');
        await loadUsers();
      } else {
        showAlert(result.error || 'Error al actualizar rol', 'error');
      }
    } catch (error) {
      showAlert('Error al actualizar rol', 'error');
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const result = await authService.updateUserStatus(userId, newStatus);
      if (result.success) {
        showAlert(`Usuario ${newStatus === 'active' ? 'activado' : 'suspendido'} correctamente`, 'success');
        await loadUsers();
      } else {
        showAlert(result.error || 'Error al actualizar estado', 'error');
      }
    } catch (error) {
      showAlert('Error al actualizar estado', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await authService.deleteUser(userId);
      if (result.success) {
        showAlert('Usuario eliminado correctamente', 'success');
        await loadUsers();
      } else {
        showAlert(result.error || 'Error al eliminar usuario', 'error');
      }
    } catch (error) {
      showAlert('Error al eliminar usuario', 'error');
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-600 border border-red-200/60 shadow-sm';
      case 'vendedor':
        return 'bg-blue-50 text-blue-600 border border-blue-200/60 shadow-sm';
      default:
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm';
    }
  };

  const getStatusBadgeStyle = (status) => {
    return status === 'active' 
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm' 
      : 'bg-slate-100 text-slate-600 border border-slate-200/60 shadow-sm';
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f8fafc]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] py-6 sm:py-12 text-[#0f172a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Cabecera Creativa */}
        <div className="relative overflow-hidden bg-[#162536] rounded-3xl p-6 sm:p-10 shadow-xl text-white">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#FFB872]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-[#545F6D]/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-[#FFB872] border border-white/10 shadow-inner">
                <Sparkles className="w-3.5 h-3.5" /> Control de Acceso y Cuentas
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Gestión de Usuarios
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Administra permisos, roles, estados activos y accesos globales de los usuarios en la plataforma.
              </p>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-3">
              <button 
                onClick={loadUsers} 
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold py-3 px-6 rounded-2xl backdrop-blur-md border border-white/15 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10"
              >
                <RefreshCw className="w-4 h-4" /> Refrescar Lista
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white/80 shadow-xl shadow-slate-200/50">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o correo electrónico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Contenedor Principal de Usuarios */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80">
          
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-semibold">
              No se encontraron usuarios registrados con ese criterio.
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL (Tarjetas apiladas para evitar desbordes) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-4 shadow-sm transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-xs shadow-inner shrink-0">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{user.name || 'Sin Nombre'}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      {user.id === currentUser?.id && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full shrink-0">(tú)</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rol</span>
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          disabled={user.id === currentUser?.id}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${getRoleBadgeStyle(user.role)}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="cliente">Cliente</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estado</span>
                        <select
                          value={user.status || 'active'}
                          onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                          disabled={user.id === currentUser?.id}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${getStatusBadgeStyle(user.status || 'active')}`}
                        >
                          <option value="active">Activo</option>
                          <option value="suspended">Suspendido</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="flex-1 py-2 px-3 bg-white hover:bg-slate-900 hover:text-white rounded-xl text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver detalles
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                        className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-xl transition-all border border-rose-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* VISTA DESKTOP (Tabla clásica optimizada) */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-xs shadow-sm shrink-0">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="font-bold text-sm text-slate-800">
                              {user.name || 'Sin Nombre'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-500">{user.email}</td>
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-1">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${getRoleBadgeStyle(user.role)}`}
                              disabled={user.id === currentUser?.id}
                            >
                              <option value="admin">Admin</option>
                              <option value="vendedor">Vendedor</option>
                              <option value="cliente">Cliente</option>
                            </select>
                            {user.id === currentUser?.id && (
                              <span className="text-[10px] text-slate-400 ml-1 font-semibold">(tú)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={user.status || 'active'}
                            onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${getStatusBadgeStyle(user.status || 'active')}`}
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
                              className="p-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center active:scale-95"
                              title="Ver detalles"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.id === currentUser?.id}
                              className="p-2.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center active:scale-95"
                              title="Eliminar cuenta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Resumen inferior de contadores */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-semibold">
            <span>Total mostrados: <strong className="text-slate-800">{filteredUsers.length}</strong> usuarios</span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5 text-red-500" /> {users.filter(u => u.role === 'admin').length} admins</span>
              <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-blue-500" /> {users.filter(u => u.role === 'vendedor').length} vendedores</span>
              <span className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5 text-emerald-500" /> {users.filter(u => u.role === 'cliente').length} clientes</span>
            </div>
          </div>
        </div>

        {/* Modal de Detalles del Usuario */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Detalles del Usuario
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-900 hover:text-white flex items-center justify-center text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl text-blue-600 font-extrabold shadow-sm shrink-0">
                    {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-slate-800 truncate">
                      {selectedUser.name || 'Sin Nombre'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rol actual</span>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${getRoleBadgeStyle(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estado</span>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${getStatusBadgeStyle(selectedUser.status || 'active')}`}>
                      {selectedUser.status || 'active'}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Creado</span>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Actualizado</span>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Acciones rápidas de estado</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedUser.id, 'active');
                        setShowModal(false);
                      }}
                      disabled={selectedUser.status === 'active' || selectedUser.id === currentUser?.id}
                      className="border border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-600 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Activar Cuenta
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedUser.id, 'suspended');
                        setShowModal(false);
                      }}
                      disabled={selectedUser.status === 'suspended' || selectedUser.id === currentUser?.id}
                      className="bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <UserX className="w-3.5 h-3.5" /> Suspender Cuenta
                    </button>
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
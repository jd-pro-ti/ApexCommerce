'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  FiSearch,
  FiGrid,
  FiShoppingBag,
  FiBox,
  FiBarChart2,
  FiUsers,
  FiBell,
  FiTrendingUp,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiUserCheck,
  FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { logout, role } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const adminMenu = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: FiGrid },
    { name: 'Perfil', href: '/perfil', icon: FiUserCheck },
    { name: 'Gestión de usuarios', href: '/dashboard/admin/usuarios', icon: FiUsers },
    { name: 'Analíticas', href: '/dashboard/admin/analiticas', icon: FiBarChart2 },
    { name: 'Solicitudes de vendedor', href: '/dashboard/admin/vendedores-solicitudes', icon: FiUserCheck },
    { name: 'Logs', href: '/dashboard/admin/logs', icon: FiFileText },
    { name: 'Reportes', href: '/dashboard/admin/reportes', icon: FiBarChart2 }
  ];

  const sellerMenu = [
    { name: 'Dashboard', href: '/dashboard/vendedor', icon: FiGrid },
    { name: 'Perfil', href: '/dashboard/vendedor/perfil', icon: FiUserCheck },
    { name: 'Productos', href: '/dashboard/vendedor/productos', icon: FiBox },
    { name: 'Pedidos', href: '/dashboard/vendedor/pedidos', icon: FiShoppingBag },
    { name: 'Notificaciones', href: '/dashboard/vendedor/notificaciones', icon: FiBell },
    { name: 'Analíticas', href: '/dashboard/vendedor/analiticas', icon: FiBarChart2 },
    { name: 'Ganancias', href: '/dashboard/vendedor/ganancias', icon: FiTrendingUp }
  ];

  const currentMenuItems = role === 'admin' ? adminMenu : sellerMenu;
  const menuTitle = role === 'admin' ? 'ADMINISTRACIÓN' : 'VENDEDOR';

  return (
    <aside
      className={`h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-30 sticky top-0 shadow-sm ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header del Sidebar con los puntos de Mac y Logo */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary border border-primary/10 shadow-xs flex-shrink-0">
              <FiUserCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-base tracking-tight ml-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Apex<span className="text-[#FFB872]">Commerce</span>
            </span>
          </div>
        ) : (
          <div className="mx-auto flex flex-col items-center gap-1">
            <div className="flex gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <span className="font-bold text-slate-900 text-lg text-[#38bdf8]">∞</span>
          </div>
        )}
      </div>

      {/* Buscador */}
      {!collapsed && (
        <div className="px-4 py-4">
          <div className="relative flex items-center">
            <FiSearch className="absolute left-3 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar elemento..."
              className="w-full bg-slate-100 text-slate-900 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-transparent focus:outline-none focus:border-[#38bdf8] focus:bg-white transition-colors placeholder:text-slate-400"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>
        </div>
      )}

      {/* Contenido desplazable del menú */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {menuTitle}
            </p>
          )}
          <nav className="space-y-1">
            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-amber-50/80 text-amber-700 font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-600' : 'text-slate-500 group-hover:text-slate-800'}`} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                      {item.hasSub && (
                        <FiChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                  )}

                  {/* Indicador lateral activo */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer del Sidebar (Settings, Logout y Copyright) */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <FiSettings className="w-4 h-4 flex-shrink-0 text-slate-500" />
          {!collapsed && <span>Configuración</span>}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <FiLogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        {!collapsed && (
          <p className="text-[10px] text-slate-400 text-center pt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ©2026 ApexCommerce. Todos los derechos reservados.
          </p>
        )}
      </div>
    </aside>
  );
}

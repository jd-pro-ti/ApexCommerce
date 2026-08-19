'use client';
import { useCallback, useEffect, useState } from 'react';
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
  FiChevronDown,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { logout, role } = useAuth();

  const loadUnreadNotifications = useCallback(async () => {
    if (role !== 'vendedor') return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const response = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setUnreadNotifications((data.notifications || []).filter((notification) => !notification.read_at).length);
  }, [role]);

  useEffect(() => {
    if (role !== 'vendedor') return undefined;
    loadUnreadNotifications();
    const interval = window.setInterval(loadUnreadNotifications, 30000);
    const handleRead = (event) => setUnreadNotifications((current) => Math.max(0, current - Number(event.detail?.count || 0)));
    window.addEventListener('seller-notifications-read', handleRead);
    const channel = supabase.channel(`seller-notifications-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadUnreadNotifications)
      .subscribe();
    return () => { window.clearInterval(interval); window.removeEventListener('seller-notifications-read', handleRead); supabase.removeChannel(channel); };
  }, [loadUnreadNotifications, role]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const adminMenu = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: FiGrid },
    { name: 'Gestión de usuarios', href: '/dashboard/admin/usuarios', icon: FiUsers },
    { name: 'Analíticas', href: '/dashboard/admin/analiticas', icon: FiBarChart2 },
    { name: 'Solicitudes', href: '/dashboard/admin/vendedores-solicitudes', icon: FiUserCheck },
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
    <>
      {/* Barra superior móvil tipo header para evitar que se encima en el contenido */}
      <div className="lg:hidden w-full bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
            <FiUserCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Apex<span className="text-[#FFB872]">Commerce</span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          aria-label="Abrir menú"
        >
          <FiMenu className="w-5 h-5" />
        </button>
      </div>

      {/* Capa oscura de fondo (Backdrop) cuando el menú lateral móvil está abierto */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        />
      )}

      {/* Estructura del Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-50 shadow-sm ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header interno del Sidebar (Visible en desktop o dentro del drawer móvil) */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shadow-xs flex-shrink-0">
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

          {/* Botón para cerrar en móvil */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

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
                    onClick={() => setMobileOpen(false)}
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
                        {item.name === 'Notificaciones' && unreadNotifications > 0 && (
                          <span className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                          </span>
                        )}
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

                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            href={role === 'admin' ? '/dashboard/admin/configuraciones' : '/dashboard/vendedor/configuraciones'}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <FiSettings className="w-4 h-4 flex-shrink-0 text-slate-500" />
            {!collapsed && <span>Configuración</span>}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
    </>
  );
}
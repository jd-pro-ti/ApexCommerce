import RoleSettings from '@/components/dashboard/RoleSettings';

export const metadata = { title: 'Configuración del administrador - APEX Commerce' };

export default function AdminSettingsPage() {
  return <RoleSettings role="admin" />;
}

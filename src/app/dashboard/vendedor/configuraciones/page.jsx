import RoleSettings from '@/components/dashboard/RoleSettings';

export const metadata = { title: 'Configuración del vendedor - APEX Commerce' };

export default function SellerSettingsPage() {
  return <RoleSettings role="vendedor" />;
}

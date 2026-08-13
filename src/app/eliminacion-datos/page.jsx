export const metadata = { title: 'Eliminación de datos | Apex Commerce' };

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] px-6 py-16 text-[#010f20]">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dd9448]">Apex Commerce</p>
        <h1 className="mt-3 text-3xl font-extrabold">Eliminación de datos</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-700">
          <p>Para solicitar la eliminación de tu cuenta y los datos asociados, inicia sesión en Apex Commerce y entra a <strong>Perfil → Eliminar cuenta</strong>. El administrador revisará y procesará la solicitud.</p>
          <p>La eliminación retira la cuenta, información personal, productos, imágenes y datos relacionados, conforme a las limitaciones legales y operativas aplicables.</p>
          <p>Si no puedes iniciar sesión, solicita ayuda escribiendo a <a className="font-semibold underline" href="mailto:soporte@apexcommerce.com">soporte@apexcommerce.com</a> desde el correo asociado a tu cuenta.</p>
        </div>
      </article>
    </main>
  );
}

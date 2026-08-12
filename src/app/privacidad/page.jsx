export const metadata = {
  title: 'Aviso de Privacidad | Apex Commerce',
  description: 'Aviso de privacidad de Apex Commerce.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] px-6 py-16 text-[#010f20]">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dd9448]">Apex Commerce</p>
        <h1 className="mt-3 text-3xl font-extrabold">Aviso de Privacidad</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: 12 de agosto de 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-[#010f20]">1. Información que recopilamos</h2>
            <p>Podemos recopilar datos de contacto, información de cuenta, datos necesarios para procesar pedidos y la información que el usuario decide proporcionar al utilizar Apex Commerce.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[#010f20]">2. Uso de la información</h2>
            <p>Usamos la información para crear y proteger cuentas, procesar compras, mostrar productos, enviar notificaciones relacionadas con el servicio y mejorar la experiencia de la plataforma.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[#010f20]">3. Inicio de sesión con terceros</h2>
            <p>Si el usuario inicia sesión con Google o Facebook, recibimos los datos que el proveedor autorice, como nombre, correo electrónico y foto de perfil, de acuerdo con sus políticas y permisos.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[#010f20]">4. Protección y conservación</h2>
            <p>Aplicamos medidas razonables para proteger la información. Conservamos los datos mientras sean necesarios para prestar el servicio, cumplir obligaciones legales o resolver disputas.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[#010f20]">5. Derechos y contacto</h2>
            <p>Para solicitar acceso, corrección o eliminación de tus datos, escribe a <a className="font-semibold text-[#010f20] underline" href="mailto:soporte@apexcommerce.com">soporte@apexcommerce.com</a>.</p>
          </section>
        </div>
      </article>
    </main>
  );
}

export const metadata = { title: 'Términos y condiciones | Apex Commerce' };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] px-6 py-24 text-[#010f20]">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dd9448]">Apex Commerce</p>
        <h1 className="mt-3 text-3xl font-extrabold">Términos y condiciones</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Estos términos regulan el uso de Apex Commerce, una plataforma de comercio electrónico que conecta clientes con vendedores independientes.</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section><h2 className="text-lg font-bold text-[#010f20]">1. Cuenta y acceso</h2><p>Para usar ciertas funciones debes crear una cuenta con datos veraces. Eres responsable de proteger tus credenciales y de avisar si detectas un acceso no autorizado. El acceso puede realizarse con correo electrónico, Google o Facebook.</p></section>
          <section><h2 className="text-lg font-bold text-[#010f20]">2. Clientes y pedidos</h2><p>El cliente debe proporcionar información correcta para el pedido y la entrega. Los precios, existencias, impuestos, costos de envío y disponibilidad pueden cambiar antes de confirmar una compra. El estado del pedido puede actualizarse hasta su entrega o cancelación.</p></section>
          <section><h2 className="text-lg font-bold text-[#010f20]">3. Vendedores</h2><p>Los vendedores son responsables de la legalidad, exactitud, calidad, disponibilidad, descripción, precio, inventario y cumplimiento de sus productos. Apex Commerce puede revisar, ocultar o rechazar publicaciones que incumplan estos términos o la legislación aplicable.</p></section>
          <section><h2 className="text-lg font-bold text-[#010f20]">4. Pagos y PayPal</h2><p>Los pagos pueden procesarse mediante proveedores externos, incluido PayPal. Apex Commerce puede aplicar una comisión de plataforma del 15% y liquidar al vendedor el 85% correspondiente, sujeto al estado del pago, la entrega, reembolsos, contracargos y las reglas del proveedor de pagos.</p></section>
          <section><h2 className="text-lg font-bold text-[#010f20]">5. Conducta y contenido</h2><p>No está permitido usar la plataforma para fraude, spam, suplantación, actividades ilegales, manipulación de pedidos, abuso de promociones o publicación de contenido que infrinja derechos de terceros.</p></section>
          <section><h2 className="text-lg font-bold text-[#010f20]">6. Seguridad y comunicaciones</h2><p>Podemos enviar correos de confirmación, recuperación de contraseña, seguridad, pedidos y actividad de la cuenta. No solicitaremos tu contraseña por correo. Los servicios de autenticación y correo pueden depender de proveedores externos.</p></section>
          <section><h2 className="text-lg font-bold text-[#010f20]">7. Suspensión y eliminación</h2><p>Podemos suspender cuentas que incumplan estos términos o representen un riesgo para otros usuarios. El usuario puede solicitar la eliminación desde su perfil; la solicitud será revisada y ejecutada por un administrador, conforme a las obligaciones legales aplicables.</p></section>
          <section><h2 className="text-lg font-bold text-[#010f20]">8. Privacidad</h2><p>El tratamiento de datos personales se explica en nuestro <a className="font-semibold underline" href="/privacidad">Aviso de Privacidad</a>. Al usar inicio de sesión social, el proveedor puede compartir los datos autorizados por el usuario.</p></section>
          <section><h2 className="text-lg font-bold text-[#010f20]">9. Cambios y contacto</h2><p>Podemos actualizar estos términos para reflejar cambios en el servicio o en la legislación. Publicaremos la versión vigente en esta página. Para dudas escribe a <a className="font-semibold underline" href="mailto:soporte@apexcommerce.com">soporte@apexcommerce.com</a>.</p></section>
        </div>
      </article>
    </main>
  );
}

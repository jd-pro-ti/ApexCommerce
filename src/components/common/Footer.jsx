import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const linkClass = 'hover:text-[#dd9448] transition-colors';

  return (
    <footer className="bg-[#020618] text-[#c4c6cd]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 space-y-4">
            <h3 className="text-xl font-semibold tracking-tight text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Apex <span className="text-[#dd9448]">Commerce</span></h3>
            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>Conectando compradores y vendedores en un entorno seguro, premium y de alta confianza.</p>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>Links Rápidos</h4>
            <ul className="space-y-4 text-sm" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <li><Link href="/" className={linkClass}>Inicio</Link></li>
              <li><Link href="/catalogo" className={linkClass}>Catálogo</Link></li>
              <li><Link href="/convertirse-vendedor" className={linkClass}>Vende con nosotros</Link></li>
              <li><a href="mailto:apexcommerce778@gmail.com" className={linkClass}>Contacto</a></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>Categorías</h4>
            <ul className="space-y-4 text-sm" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <li><Link href="/catalogo?categoria=Electr%C3%B3nicos" className={linkClass}>Electrónicos</Link></li>
              <li><Link href="/catalogo?categoria=Hogar" className={linkClass}>Hogar</Link></li>
              <li><Link href="/catalogo?categoria=Ropa" className={linkClass}>Ropa</Link></li>
              <li><Link href="/catalogo?categoria=Deportes" className={linkClass}>Deportes</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>Contacto</h4>
            <ul className="space-y-4 text-sm" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <li className="flex items-center gap-3"><span className="text-[#dd9448]" aria-hidden="true">✉</span><a href="mailto:apexcommerce778@gmail.com" className={linkClass}>apexcommerce778@gmail.com</a></li>
              <li className="flex items-center gap-3"><span className="text-[#dd9448]" aria-hidden="true">⌕</span><a href="tel:+524471268093" className={linkClass}>+52 447 126 8093</a></li>
              <li className="flex items-center gap-3"><span className="text-[#dd9448]" aria-hidden="true">●</span><span>México</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#c4c6cd]/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>© {currentYear} APEX Commerce. Todos los derechos reservados.</p>
          <div className="flex gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}><Link href="/privacidad" className="hover:text-white transition-colors">Aviso de Privacidad</Link><Link href="/terminos" className="hover:text-white transition-colors">Términos de Servicio</Link></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

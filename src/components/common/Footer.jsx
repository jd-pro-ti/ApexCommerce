import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f5f3f4] border-t border-[#c4c6cd]/30 transition-colors">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Columna 1 - Logo & Descripción */}
          <div className="col-span-1 space-y-3">
            <h3 
              className="text-xl font-semibold tracking-tight text-[#010f20]" 
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Apex <span className="text-[#dd9448]">Commerce</span>
            </h3>
            <p 
              className="text-[#44474c] text-sm leading-relaxed"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Conectando compradores y vendedores en un entorno seguro, premium y de alta confianza. Definimos la intersección entre utilidad profesional y diseño exclusivo.
            </p>
          </div>

          {/* Columna 2 - Links Rápidos */}
          <div className="col-span-1">
            <h4 
              className="text-xs font-bold uppercase tracking-widest text-[#010f20] mb-4"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Links Rápidos
            </h4>
            <ul 
              className="space-y-3 text-sm"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              <li>
                <a href="/catalogo" className="text-[#44474c] hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">
                  Catálogo
                </a>
              </li>
              <li>
                <a href="/sobre-nosotros" className="text-[#44474c] hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="/contacto" className="text-[#44474c] hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3 - Categorías */}
          <div className="col-span-1">
            <h4 
              className="text-xs font-bold uppercase tracking-widest text-[#010f20] mb-4"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Categorías
            </h4>
            <ul 
              className="space-y-3 text-sm"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              <li>
                <a href="/catalogo?categoria=tech" className="text-[#44474c] hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">
                  Tecnología de Trabajo
                </a>
              </li>
              <li>
                <a href="/catalogo?categoria=living" className="text-[#44474c] hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">
                  Hogar Moderno
                </a>
              </li>
              <li>
                <a href="/catalogo?categoria=lifestyle" className="text-[#44474c] hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">
                  Estilo de Vida Élite
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4 - Contacto con SVGs Profesionales */}
          <div className="col-span-1">
            <h4 
              className="text-xs font-bold uppercase tracking-widest text-[#010f20] mb-4"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Contacto
            </h4>
            <ul 
              className="space-y-3 text-sm text-[#44474c]"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              {/* Correo */}
              <li className="flex items-center gap-3">
                <div className="text-[#010f20] bg-[#010f20]/5 p-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <a href="mailto:soporte@apexcommerce.com" className="hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">
                  soporte@apexcommerce.com
                </a>
              </li>

              {/* Teléfono */}
              <li className="flex items-center gap-3">
                <div className="text-[#010f20] bg-[#010f20]/5 p-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <a href="tel:+525512345678" className="hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">
                  +52 55 1234 5678
                </a>
              </li>

              {/* Dirección */}
              <li className="flex items-center gap-3">
                <div className="text-[#010f20] bg-[#010f20]/5 p-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span>CDMX, México</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria inferior y Copyright */}
        <div className="border-t border-[#c4c6cd]/25 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#44474c]">
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="tracking-wide">
            © {currentYear} APEX Commerce. Todos los derechos reservados.
          </p>
          <div 
            className="flex gap-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <a href="/privacidad" className="hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">Aviso de Privacidad</a>
            <a href="/terminos" className="hover:text-[#010f20] hover:underline underline-offset-4 transition-colors">Términos de Servicio</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1 - Logo */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold text-blue-600 mb-2">APEX</h3>
            <p className="text-gray-600 text-sm">
              Conectando compradores y vendedores en un solo lugar.
            </p>
          </div>

          {/* Columna 2 - Links Rápidos */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-800 mb-3">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/catalogo" className="text-gray-600 hover:text-blue-600">Catálogo</a></li>
              <li><a href="/sobre-nosotros" className="text-gray-600 hover:text-blue-600">Sobre Nosotros</a></li>
              <li><a href="/contacto" className="text-gray-600 hover:text-blue-600">Contacto</a></li>
            </ul>
          </div>

          {/* Columna 3 - Categorías */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-800 mb-3">Categorías</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/catalogo?categoria=electronica" className="text-gray-600 hover:text-blue-600">Electrónicos</a></li>
              <li><a href="/catalogo?categoria=ropa" className="text-gray-600 hover:text-blue-600">Ropa</a></li>
              <li><a href="/catalogo?categoria=hogar" className="text-gray-600 hover:text-blue-600">Hogar</a></li>
            </ul>
          </div>

          {/* Columna 4 - Contacto */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-800 mb-3">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>📧 soporte@apexcommerce.com</li>
              <li>📞 +52 55 1234 5678</li>
              <li>📍 CDMX, México</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-600">
          © {currentYear} APEX Commerce. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
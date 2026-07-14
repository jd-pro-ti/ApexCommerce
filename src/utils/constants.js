// Constantes de la aplicación
export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'vendedor',
  CLIENT: 'cliente',
};

export const ROUTES = {
  HOME: '/',
  CATALOG: '/catalogo',
  LOGIN: '/login',
  REGISTER: '/registro',
  DASHBOARD: '/dashboard',
  CART: '/carrito',
  PROFILE: '/perfil',
};

export const API_BASE = '/api';
export const APP_NAME = 'APEX COMMERCE';

// Datos de ejemplo para testing
export const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Smartphone X Pro',
    price: 599.99,
    category: 'Electrónicos',
    rating: 4.5,
    stock: 15,
    image: '/images/product1.jpg',
    seller: 'TechStore',
    description: 'Smartphone de última generación con 5G'
  },
  {
    id: '2',
    name: 'Laptop Ultra Slim',
    price: 899.99,
    category: 'Electrónicos',
    rating: 4.8,
    stock: 8,
    image: '/images/product2.jpg',
    seller: 'ElectroShop',
    description: 'Laptop ligera y potente para profesionales'
  },
  // ... más productos de ejemplo
];

export const MOCK_CATEGORIES = [
  { id: '1', name: 'Electrónicos', icon: '📱' },
  { id: '2', name: 'Ropa', icon: '👕' },
  { id: '3', name: 'Hogar', icon: '🏠' },
  { id: '4', name: 'Deportes', icon: '⚽' },
];
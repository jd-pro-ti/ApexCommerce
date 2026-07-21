'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/productService';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  ArrowLeft 
} from 'lucide-react';

export default function NewProduct() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    status: 'active',
    featured: false
  });

  const categories = [
    'Electrónicos',
    'Ropa',
    'Hogar',
    'Deportes',
    'Libros',
    'Juguetes',
    'Alimentos',
    'Belleza',
    'Salud',
    'Otros'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const productId = `temp_${Date.now()}`;
      const result = await productService.uploadImages(files, productId);
      
      if (result.success) {
        setImages(prev => [...prev, ...result.urls]);
      } else {
        setError(result.error || 'Error al subir imágenes');
      }
    } catch (error) {
      setError('Error al subir imágenes');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = async (imageUrl) => {
    try {
      const result = await productService.deleteImage(imageUrl);
      if (result.success) {
        setImages(images.filter(img => img !== imageUrl));
      }
    } catch (error) {
      setError('Error al eliminar imagen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('El nombre del producto es requerido');
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('El precio debe ser mayor a 0');
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError('La categoría es requerida');
      setLoading(false);
      return;
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      setError('El stock debe ser un número válido');
      setLoading(false);
      return;
    }

    try {
      const productData = {
        seller_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
        images: images,
        status: formData.status,
        featured: formData.featured
      };

      const result = await productService.createProduct(productData);
      
      if (result.success) {
        router.push('/dashboard/vendedor/productos');
      } else {
        setError(result.error || 'Error al crear producto');
      }
    } catch (error) {
      setError('Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.name) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f8f9fa]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pt-28 md:pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera y Navegación */}
        <div className="mb-8">
          <Link 
            href="/dashboard/vendedor/productos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#44474c]/70 hover:text-[#010f20] mb-3 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <ArrowLeft className="w-4 h-4" /> Volver a mis productos
          </Link>
          <span 
            className="text-[11px] font-bold tracking-widest text-[#dd9448] uppercase block mb-1"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            INVENTARIO
          </span>
          <h1 
            className="text-3xl sm:text-4xl font-bold text-[#010f20] tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Nuevo Producto
          </h1>
          <p 
            className="text-sm text-[#44474c]/70 mt-1.5"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Completa los datos para agregar un nuevo artículo a tu tienda.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Principal: Información General */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[#efedef] p-8 sm:p-10 shadow-sm">
                <h3 
                  className="font-bold text-[#010f20] text-lg mb-6 pb-4 border-b border-[#efedef]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Información del Producto
                </h3>

                <div className="space-y-6">
                  <Input
                    label="Nombre del producto"
                    name="name"
                    placeholder="Ej: Smartphone X Pro"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    required
                  />

                  <div>
                    <label 
                      className="block text-xs font-bold text-[#010f20] uppercase tracking-wider mb-2"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      rows="5"
                      placeholder="Describe las características principales de tu producto..."
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800 shadow-sm"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="Precio ($)"
                      type="number"
                      name="price"
                      placeholder="99.99"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      required
                    />

                    <Input
                      label="Stock disponible"
                      type="number"
                      name="stock"
                      placeholder="10"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label 
                        className="block text-xs font-bold text-[#010f20] uppercase tracking-wider mb-2"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Categoría *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800 shadow-sm"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        required
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label 
                        className="block text-xs font-bold text-[#010f20] uppercase tracking-wider mb-2"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Estado
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800 shadow-sm"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <option value="active">Activo</option>
                        <option value="draft">Borrador</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center pt-3">
                    <input
                      type="checkbox"
                      id="featured"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleChange}
                      className="h-5 w-5 text-slate-900 focus:ring-slate-800 border-gray-300 rounded cursor-pointer"
                    />
                    <label 
                      htmlFor="featured" 
                      className="ml-3 text-sm font-medium text-slate-700 select-none cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Destacar producto en la tienda principal
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Lateral: Imágenes y Acciones */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#efedef] p-8 shadow-sm">
                <h3 
                  className="font-bold text-[#010f20] text-lg mb-5 pb-3 border-b border-[#efedef]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Imágenes
                </h3>
                
                <div className="space-y-5">
                  <div className="border-2 border-dashed border-gray-200 hover:border-slate-400 rounded-2xl p-8 text-center transition-colors bg-[#fafbfc]">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImages}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer block"
                    >
                      <div className="w-14 h-14 bg-white text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                      <p 
                        className="text-sm font-semibold text-slate-800 mb-1"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {uploadingImages ? 'Subiendo imágenes...' : 'Haz clic para subir'}
                      </p>
                      <p 
                        className="text-xs text-slate-400"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        JPG, PNG, WebP (máx. 5MB)
                      </p>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 h-28 bg-slate-50 shadow-sm">
                          <img
                            src={image}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image)}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div 
                    className="text-xs font-medium text-slate-500 pt-1"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {images.length} {images.length === 1 ? 'imagen subida' : 'imágenes subidas'}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="bg-white rounded-2xl border border-[#efedef] p-6 shadow-sm space-y-3">
                <Button 
                  type="submit" 
                  className="w-full !bg-[#0b1523] hover:!bg-slate-800 !text-white text-sm font-bold py-4 rounded-xl transition-all shadow-sm focus:ring-0 uppercase tracking-wide flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  loading={loading}
                >
                  <Plus className="w-4 h-4" /> {loading ? 'Creando...' : 'Crear Producto'}
                </Button>
                
                <Link href="/dashboard/vendedor/productos" className="block">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full border border-gray-200 hover:border-slate-800 text-slate-700 text-sm font-semibold py-3.5 rounded-xl transition-all shadow-sm focus:ring-0"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Cancelar
                  </Button>
                </Link>
              </div>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
}
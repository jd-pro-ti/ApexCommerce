'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/productService';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

    // Validaciones
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
        <p className="text-gray-600 mt-1">Completa los datos para agregar un nuevo producto</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="space-y-4">
                <Input
                  label="Nombre del producto *"
                  name="name"
                  placeholder="Ej: Smartphone X Pro"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    placeholder="Describe tu producto..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Precio *"
                    type="number"
                    name="price"
                    placeholder="99.99"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                  />

                  <Input
                    label="Stock *"
                    type="number"
                    name="stock"
                    placeholder="10"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Categoría *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="active">Activo</option>
                    <option value="draft">Borrador</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Destacar producto en la tienda
                  </label>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Imágenes del producto</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-sm text-gray-600">
                      {uploadingImages ? 'Subiendo...' : 'Haz clic para subir imágenes'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WebP (máx. 5MB)
                    </p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {images.length} imágenes subidas
                </div>
              </div>
            </Card>

            <div className="mt-6 flex gap-3">
              <Button type="submit" className="flex-1" size="lg" loading={loading}>
                {loading ? 'Creando...' : 'Crear Producto'}
              </Button>
              <Link href="/dashboard/vendedor/productos/nuevo" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  Cancelar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
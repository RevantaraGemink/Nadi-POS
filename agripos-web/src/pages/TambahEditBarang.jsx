import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api';
import { useEffect, useState } from 'react';

export default function TambahEditBarang() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0
  });
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchApi(`/products/${id}`),
    enabled: isEdit
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku || '',
        category: product.category,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stock: product.stock
      });
      setSkuManuallyEdited(true); // saat edit, anggap SKU sudah fixed
    }
  }, [product]);

  // Auto-fetch preview SKU saat kategori berubah (hanya mode tambah baru)
  useEffect(() => {
    if (isEdit || !formData.category || skuManuallyEdited) return;

    let cancelled = false;
    setSkuLoading(true);
    fetchApi(`/products/preview-sku?category=${encodeURIComponent(formData.category)}`)
      .then((res) => {
        if (!cancelled) {
          setFormData(prev => ({ ...prev, sku: res.sku }));
        }
      })
      .finally(() => {
        if (!cancelled) setSkuLoading(false);
      });

    return () => { cancelled = true; };
  }, [formData.category, isEdit, skuManuallyEdited]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (isEdit) {
        return fetchApi(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const newProduct = await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (payload.stock > 0) {
          await fetchApi('/transactions', {
            method: 'POST',
            body: JSON.stringify({
              transactionType: 'Pembelian',
              description: `Stok Awal: ${payload.name}`,
              debit: 0,
              credit: payload.costPrice * payload.stock,
              items: [{
                productId: newProduct.id,
                quantity: payload.stock,
                price: payload.costPrice,
                discount: 0
              }]
            }),
          });
        }
        return newProduct;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      setLocation('/inventory');
    },
    onError: (error) => {
      alert(`Gagal menyimpan: ${error.message}\n\nDetail: ${error.details || 'Tidak ada detail tambahan'}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      // Reset SKU manual edit flag saat ganti kategori di mode tambah baru
      if (!isEdit) setSkuManuallyEdited(false);
    }
    if (name === 'sku') {
      setSkuManuallyEdited(true);
    }
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Price') || name === 'stock' ? Number(value) : value
    }));
  };

  const handleResetSku = () => {
    setSkuManuallyEdited(false);
  };

  const categories = ['Insektisida', 'Herbisida', 'Pupuk', 'Fungisida', 'Benih', 'Alat'];

  // Calculate real-time margin
  const nominalProfit = formData.sellingPrice - formData.costPrice;
  const marginPercentage = formData.sellingPrice > 0 ? (nominalProfit / formData.sellingPrice) * 100 : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  if (isEdit && isLoadingProduct) return <div className="p-8 text-center font-medium">Memuat data barang...</div>;

  return (
    <div className="flex-1 p-margin-page overflow-y-auto bg-surface w-full">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb / Back */}
        <div 
          onClick={() => setLocation('/inventory')} 
          className="mb-6 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-fit"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span className="font-table-data text-table-data">Kembali ke Manajemen Stok</span>
        </div>

        <div className="mb-6">
          <h2 className="font-headline-md text-headline-md font-bold text-primary">{isEdit ? 'Edit Harga & Detail Barang' : 'Tambah Barang Baru'}</h2>
          <p className="text-on-surface-variant mt-1 font-body-md text-body-md">Sesuaikan informasi produk agrikultur Anda.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 lg:p-8 flex flex-col gap-8 shadow-sm">
          {/* Section: Informasi Dasar */}
          <div>
            <h3 className="font-headline-md text-body-lg font-bold text-primary border-b border-outline-variant pb-2 mb-4">Informasi Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Produk */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="font-table-data text-table-data text-on-surface-variant font-medium" htmlFor="name">Nama Produk</label>
                <input name="name" value={formData.name} onChange={handleChange} className="h-input-height px-3 bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors font-body-md text-body-md text-on-surface placeholder-outline" id="name" placeholder="Contoh: NPK Mutiara 16-16-16" type="text" required />
              </div>

              {/* Kategori */}
              <div className="flex flex-col gap-1">
                <label className="font-table-data text-table-data text-on-surface-variant font-medium" htmlFor="category">Kategori</label>
                <div className="relative">
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full h-input-height px-3 appearance-none bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors font-body-md text-body-md text-on-surface pr-10" id="category" required>
                    <option disabled value="">Pilih Kategori</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>

              {/* SKU */}
              <div className="flex flex-col gap-1">
                <label className="font-table-data text-table-data text-on-surface-variant font-medium" htmlFor="sku">
                  SKU
                  {!isEdit && (
                    <span className="ml-2 text-[10px] font-normal text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">
                      {skuManuallyEdited ? 'diubah manual' : 'otomatis'}
                    </span>
                  )}
                </label>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      className={`w-full h-input-height px-3 pr-10 bg-surface border rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors font-label-caps text-sm text-on-surface tracking-widest ${
                        skuLoading ? 'border-outline-variant opacity-60' : 'border-outline-variant'
                      }`}
                      id="sku"
                      placeholder={skuLoading ? 'Memuat SKU...' : 'Contoh: AG-PPK-001'}
                      type="text"
                      readOnly={skuLoading}
                    />
                    {skuLoading && (
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] animate-spin">
                        autorenew
                      </span>
                    )}
                  </div>
                  {/* Tombol reset ke otomatis (hanya mode tambah & SKU sudah diedit manual) */}
                  {!isEdit && skuManuallyEdited && formData.category && (
                    <button
                      type="button"
                      onClick={handleResetSku}
                      title="Reset ke SKU otomatis"
                      className="h-input-height px-2 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors flex items-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  {isEdit
                    ? 'Format: AG-[KDE]-[NNN]. Ubah hanya jika diperlukan.'
                    : 'SKU di-generate otomatis berdasarkan kategori. Klik refresh untuk reset.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Section: Harga & Stok */}
          <div>
            <h3 className="font-headline-md text-body-lg font-bold text-primary border-b border-outline-variant pb-2 mb-4">Harga & Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <label className="font-table-data text-table-data text-on-surface-variant font-medium" htmlFor="costPrice">Harga Pokok (Beli)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-on-surface-variant font-body-md">Rp</span>
                  </div>
                  <input name="costPrice" value={formData.costPrice || ''} onChange={handleChange} className="w-full h-input-height pl-10 pr-3 bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors font-body-md text-body-md text-on-surface text-right" id="costPrice" placeholder="0" type="number" required min="0" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-table-data text-table-data text-on-surface-variant font-medium" htmlFor="sellingPrice">Harga Jual</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-on-surface-variant font-body-md">Rp</span>
                  </div>
                  <input name="sellingPrice" value={formData.sellingPrice || ''} onChange={handleChange} className="w-full h-input-height pl-10 pr-3 bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors font-body-md text-body-md text-on-surface text-right" id="sellingPrice" placeholder="0" type="number" required min="0" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-table-data text-table-data text-on-surface-variant font-medium" htmlFor="stock">Stok {isEdit ? 'Saat Ini' : 'Awal'}</label>
                <input name="stock" value={formData.stock || ''} onChange={handleChange} className="h-input-height px-3 bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors font-body-md text-body-md text-on-surface text-right font-mono" id="stock" placeholder="0" type="number" required min="0" readOnly={isEdit} />
                {isEdit && <p className="text-[10px] text-on-surface-variant mt-1">Gunakan fitur Restok untuk menambah jumlah barang.</p>}
              </div>
            </div>

            {/* Margin Preview Card */}
            <div className={`mt-6 p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors ${
              marginPercentage < 10 ? 'bg-error-container/10 border-error/30' : 'bg-primary-container/10 border-primary/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${marginPercentage < 10 ? 'bg-error text-on-error' : 'bg-primary text-on-primary'}`}>
                  <span className="material-symbols-outlined text-[20px]">trending_up</span>
                </div>
                <div>
                  <div className="font-label-caps text-label-caps text-on-surface-variant">Estimasi Margin Keuntungan</div>
                  <div className="font-headline-md text-headline-md text-on-surface">
                    {marginPercentage.toFixed(1)}% <span className="text-sm font-normal text-on-surface-variant ml-2">({formatCurrency(nominalProfit)} / unit)</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {marginPercentage < 10 ? (
                  <span className="text-error font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span> Margin Rendah
                  </span>
                ) : (
                  <span className="text-primary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Margin Sehat
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-outline-variant">
            <button onClick={() => setLocation('/inventory')} className="h-input-height px-6 rounded border border-outline-variant text-on-surface hover:bg-surface-container transition-colors font-table-data text-table-data font-medium flex items-center justify-center shadow-sm" type="button" disabled={mutation.isPending}>
              Batal
            </button>
            <button className="h-input-height px-6 rounded bg-secondary text-on-secondary hover:bg-primary transition-colors font-table-data text-table-data font-medium flex items-center justify-center gap-2 shadow-md disabled:opacity-50" type="submit" disabled={mutation.isPending}>
              <span className="material-symbols-outlined text-[18px]">save</span>
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

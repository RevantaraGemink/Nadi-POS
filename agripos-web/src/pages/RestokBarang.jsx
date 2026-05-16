import { useLocation } from "wouter";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api';

export default function RestokBarang() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [searchValue, setSearchValue] = useState('');
  const [qtyAdd, setQtyAdd] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => fetchApi('/products?page=1&limit=500')
  });

  const products = productsData?.data || [];
  
  // Find selected product
  const selectedProduct = products.find(p => p.id.toString() === searchValue);

  const mutation = useMutation({
    mutationFn: async (updatedProduct) => {
      const product = await fetchApi(`/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedProduct),
      });

      // Record restock as purchase in reports
      await fetchApi('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          transactionType: 'Pembelian',
          description: `Restok: ${selectedProduct.name}${notes ? ' - ' + notes : ''}`,
          debit: 0,
          credit: selectedProduct.costPrice * qtyAdd,
          items: [{
            productId: selectedProduct.id,
            quantity: qtyAdd,
            price: selectedProduct.costPrice,
            discount: 0
          }]
        }),
      });

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      setLocation('/inventory');
    },
    onError: (error) => {
      alert(`Gagal menyimpan: ${error.message}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return alert('Silakan pilih barang terlebih dahulu.');
    if (qtyAdd <= 0) return alert('Jumlah stok masuk harus lebih dari 0.');

    const updatedProduct = {
      ...selectedProduct,
      stock: selectedProduct.stock + qtyAdd
    };

    mutation.mutate(updatedProduct);
  };

  return (
    <div className="p-margin-page flex-1 max-w-4xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => setLocation('/inventory')} className="text-on-surface-variant hover:text-primary transition-colors flex items-center bg-transparent border-none cursor-pointer">
          <span className="material-symbols-outlined mr-1">arrow_back</span>
          Kembali
        </button>
        <h2 className="font-headline-lg text-headline-lg text-primary">Tambah Stok Barang (Restock)</h2>
      </div>

      {/* Main Form Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Item Selection */}
          <div>
            <h3 className="font-table-data text-table-data font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">1. Pilih Barang</h3>
            <div className="space-y-4">
              <div className="relative pt-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 absolute top-0 left-2 bg-surface-container-lowest px-1 z-10" htmlFor="itemSelect">Cari / Pilih Barang *</label>
                <div className="relative">
                  <select 
                    id="itemSelect"
                    className="w-full h-input-height px-3 border border-outline-variant rounded bg-transparent focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-md text-body-md text-on-surface transition-all appearance-none"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    required
                  >
                    <option value="" disabled>Pilih barang dari daftar...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Selected Item Context Card */}
              {selectedProduct && (
                <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-highest rounded flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <div>
                      <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">{selectedProduct.category}</p>
                      <p className="font-table-data text-table-data font-bold text-on-surface">{selectedProduct.name}</p>
                    </div>
                  </div>
                  <div className="text-right sm:text-right border-t sm:border-t-0 border-outline-variant pt-3 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Stok Saat Ini</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-headline-md text-headline-md font-bold text-primary">{selectedProduct.stock}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Restock Details */}
          <div className={!selectedProduct ? "opacity-50 pointer-events-none" : ""}>
            <h3 className="font-table-data text-table-data font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">2. Detail Restock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantity Input */}
              <div className="relative pt-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 absolute top-0 left-2 bg-surface-container-lowest px-1 z-10" htmlFor="qtyAdd">Jumlah Stok Masuk *</label>
                <div className="flex h-12 border border-outline-variant rounded overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                  <button 
                    type="button"
                    onClick={() => setQtyAdd(q => Math.max(0, q - 1))}
                    className="w-12 bg-surface-container-low flex items-center justify-center border-r border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <input 
                    id="qtyAdd" 
                    type="number" 
                    min="1"
                    required
                    value={qtyAdd || ''} 
                    onChange={(e) => setQtyAdd(Number(e.target.value))}
                    className="flex-1 bg-transparent border-none text-center font-label-caps text-lg font-bold text-on-surface focus:ring-0 outline-none" 
                  />
                  <button 
                    type="button"
                    onClick={() => setQtyAdd(q => q + 1)}
                    className="w-12 bg-surface-container-low flex items-center justify-center border-l border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
              
              {/* Supplier / Notes Input */}
              <div className="relative pt-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 absolute top-0 left-2 bg-surface-container-lowest px-1 z-10" htmlFor="notes">Catatan / Supplier (Opsional)</label>
                <textarea 
                  id="notes" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-12 pt-3 px-3 border border-outline-variant rounded bg-transparent focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-md text-sm text-on-surface transition-all resize-none" 
                  placeholder="Cth: PO-2023-10-001 / PT. Tani Subur"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 3: Summary */}
          {selectedProduct && qtyAdd > 0 && (
            <div className="bg-surface-bright border-2 border-primary-fixed-dim rounded p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-table-data text-table-data font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">calculate</span>
                  Estimasi Total Stok Baru
                </p>
                <p className="font-body-md text-sm text-on-surface-variant mt-1">Stok Lama ({selectedProduct.stock}) + Stok Masuk ({qtyAdd})</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-headline-lg text-primary">{selectedProduct.stock + qtyAdd}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-outline-variant">
            <button 
              type="button"
              onClick={() => setLocation('/inventory')}
              disabled={mutation.isPending}
              className="h-input-height px-6 rounded border-2 border-primary text-primary font-table-data text-table-data font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors w-full sm:w-auto"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={mutation.isPending || !selectedProduct || qtyAdd <= 0}
              className="h-input-height px-6 rounded bg-primary text-on-primary font-table-data text-table-data font-bold hover:bg-secondary transition-colors w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {mutation.isPending ? 'Menyimpan...' : 'Update Stok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

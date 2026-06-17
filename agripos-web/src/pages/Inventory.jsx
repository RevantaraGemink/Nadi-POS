import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api';
import { useState, useMemo } from 'react';

const CATEGORY_ICONS = {
  'Benih': 'eco',
  'Pupuk Cair': 'water_drop',
  'Pupuk Padat': 'layers',
  'Alat Semprot': 'precision_manufacturing',
  'Insektisida': 'bug_report',
  'Herbisida': 'grass',
  'Fungisida': 'science',
  'Alat': 'build',
  'default': 'shopping_bag',
};

export default function Inventory() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('az');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;

  const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, searchQuery, limit],
    queryFn: () => fetchApi(`/products?page=${page}&limit=${limit}${searchParam}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      alert(`Gagal menghapus: ${error.message}`);
    }
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const allProducts = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };

  // Get unique categories from loaded products
  const categories = useMemo(() => {
    const cats = ['Semua', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
    return cats.length > 1 ? cats : ['Semua', 'Insektisida', 'Herbisida', 'Pupuk', 'Fungisida', 'Benih', 'Alat'];
  }, [allProducts]);

  // Client-side filter + sort
  const products = useMemo(() => {
    let list = [...allProducts];
    if (filterCategory !== 'Semua') {
      list = list.filter(p => p.category === filterCategory);
    }
    if (sortOrder === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOrder === 'za') list.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortOrder === 'stok_low') list.sort((a, b) => a.stock - b.stock);
    else if (sortOrder === 'stok_high') list.sort((a, b) => b.stock - a.stock);
    return list;
  }, [allProducts, filterCategory, sortOrder]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const getStatusInfo = (stock) => {
    if (stock === 0) return { label: 'Kosong', icon: 'cancel', rowClass: 'status-empty', badgeClass: 'bg-error text-on-error' };
    if (stock <= 10) return { label: 'Hampir Habis', icon: 'warning', rowClass: 'status-low', badgeClass: 'bg-[#d97706] text-white' };
    return { label: 'Tersedia', icon: 'check_circle', rowClass: 'status-available', badgeClass: 'bg-secondary text-on-secondary' };
  };

  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];
  };

  const totalNilaiInventory = useMemo(() => {
    return allProducts.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
  }, [allProducts]);

  const hampirHabisCount = useMemo(() => {
    return allProducts.filter(p => p.stock > 0 && p.stock <= 10).length;
  }, [allProducts]);

  return (
    <div className="flex-1 overflow-auto bg-surface-container-lowest flex flex-col min-h-0">
      <style>{`
        .status-available { border-left: 4px solid #1f6d1a; }
        .status-low { border-left: 4px solid #d97706; background-color: #fffbeb; }
        .status-empty { border-left: 4px solid #ba1a1a; background-color: #fef2f2; }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 p-6 border-b border-outline-variant bg-surface-container-lowest shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-on-surface text-2xl font-bold tracking-tight font-headline-md">Manajemen Stok</h1>
          <p className="text-on-surface-variant text-sm">Update inventaris produk pertanian Anda secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation('/inventory/restok')} className="bg-surface hover:bg-surface-variant text-on-surface-variant font-table-data text-table-data px-4 py-2 rounded flex items-center justify-center gap-2 h-input-height transition-colors border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-[18px]">inventory</span>
            <span>Restok Barang</span>
          </button>
          <button onClick={() => setLocation('/inventory/tambah')} className="flex items-center justify-center gap-2 px-6 rounded-lg h-12 bg-primary text-on-primary text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all border-2 border-primary">
            <span className="material-symbols-outlined">add</span>
            <span>Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Search Bar in header area */}
      <div className="px-6 py-3 border-b border-outline-variant bg-surface-container-lowest shrink-0">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Cari SKU atau nama barang..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface-container-low border-b border-outline-variant shrink-0">
        <span className="text-label-caps text-on-surface-variant uppercase text-xs font-bold pl-2">Filter Kategori:</span>
        <div className="flex flex-wrap gap-2 flex-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded border text-xs font-bold transition-colors ${
                filterCategory === cat
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-on-surface border-outline hover:bg-surface-container'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-on-surface-variant">Urutkan:</span>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant text-xs rounded py-1 pl-2 pr-8 focus:ring-0 focus:border-primary text-on-surface cursor-pointer"
          >
            <option value="az">Nama (A-Z)</option>
            <option value="za">Nama (Z-A)</option>
            <option value="stok_low">Stok Terendah</option>
            <option value="stok_high">Stok Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-surface-container sticky top-0 z-10">
            <tr className="text-left border-b border-outline-variant">
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-caps">Nama Produk</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-caps text-center">Kategori</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-caps text-right">Harga Pokok</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-caps text-right">Harga Jual</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-caps text-center">Stok</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-caps text-center">Status</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-caps text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {isLoading ? (
              <tr><td colSpan="7" className="text-center p-8 text-on-surface-variant">Memuat data stok...</td></tr>
            ) : isError ? (
              <tr><td colSpan="7" className="text-center p-8 text-error">Gagal memuat data.</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-8 text-on-surface-variant">
                {filterCategory !== 'Semua' ? `Tidak ada produk kategori "${filterCategory}".` : 'Belum ada barang, silakan klik tombol Tambah Barang.'}
              </td></tr>
            ) : products.map(product => {
              const status = getStatusInfo(product.stock);
              return (
                <tr key={product.id} className={`hover:bg-surface-container-low transition-colors ${status.rowClass}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">{getCategoryIcon(product.category)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{product.name}</p>
                        <p className="text-xs text-on-surface-variant font-label-caps">{product.sku || `SKU: -`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 rounded-sm bg-surface-container text-[10px] font-bold uppercase border border-outline-variant">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatCurrency(product.costPrice)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatCurrency(product.sellingPrice)}
                  </td>
                  <td className={`px-4 py-4 text-center text-sm font-bold ${product.stock === 0 ? 'text-error' : 'text-on-surface'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {product.stock}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold uppercase ${status.badgeClass}`}>
                      <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setLocation(`/inventory/edit/${product.id}`)}
                      className="text-on-surface-variant hover:text-primary transition-colors"
                      title="Edit Barang"
                    >
                      <span className="material-symbols-outlined">edit_square</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-on-surface-variant hover:text-error transition-colors ml-2"
                      title="Hapus Barang"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-t border-outline-variant shrink-0">
        <p className="text-xs text-on-surface-variant">
          Menampilkan {products.length} dari {filterCategory !== 'Semua' ? products.length : meta.total} produk
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          {Array.from({ length: Math.min(meta.totalPages || 1, 5) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded border text-xs font-bold transition-colors ${
                  page === pageNum
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages || 1, p + 1))}
            disabled={page >= (meta.totalPages || 1)}
            className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-container text-on-surface-variant border-t border-outline-variant shrink-0">
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase font-label-caps">Total Nilai Inventory</span>
            <span className="text-sm font-bold text-on-surface" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(totalNilaiInventory)}
            </span>
          </div>
          <div className="flex flex-col border-l border-outline-variant pl-6">
            <span className="text-[10px] font-bold uppercase font-label-caps">Item Hampir Habis</span>
            <span className="text-sm font-bold text-[#d97706]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {hampirHabisCount} Produk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

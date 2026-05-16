import { useLocation } from "wouter";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api';



function Calculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  
  const handleKey = (key) => {
    if (key === 'C') {
      setDisplay('0');
    } else if (key === '=') {
      try {
        // eslint-disable-next-line no-eval
        setDisplay(eval(display).toString());
      } catch {
        setDisplay('Error');
      }
    } else {
      setDisplay(prev => prev === '0' ? key : prev + key);
    }
  };

  return (
    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-64 bg-surface border border-outline-variant rounded-lg shadow-xl overflow-hidden flex flex-col z-50">
      <div className="bg-surface-container-high p-2 border-b border-outline-variant flex justify-between items-center cursor-move">
        <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">calculate</span> Kalkulator
        </span>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <div className="p-3">
        <input className="w-full text-right font-headline-md text-xl bg-surface-container-lowest border border-outline-variant rounded p-2 mb-3 outline-none" readOnly type="text" value={display} />
        <div className="grid grid-cols-4 gap-1">
          {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map(key => (
            <button 
              key={key}
              onClick={() => handleKey(key)}
              className={`p-2 rounded font-table-data border transition-colors ${
                key === '=' ? 'bg-primary text-on-primary border-primary' : 
                ['/', '*', '-', '+'].includes(key) ? 'bg-secondary-container text-on-secondary-container border-secondary-container' :
                'bg-surface-variant hover:bg-surface-container-high border-outline-variant'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Kasir() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [cart, setCart] = useState([]);
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [sortAZ, setSortAZ] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalc, setShowCalc] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => fetchApi('/products?page=1&limit=200')
  });

  const products = productsData?.data || [];
  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      const matchCategory = filterCategory === 'Semua' || p.category === filterCategory;
      const matchSearch = !searchQuery.trim() || p.name?.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchCategory && matchSearch;
    });
    if (sortAZ) list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, filterCategory, searchQuery, sortAZ]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name,
        price: product.sellingPrice,
        quantity: 1, 
        discountValue: 0,
        discountType: '%' // '%' or 'Rp'
      }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateDiscount = (productId, value, type) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, discountValue: Number(value), discountType: type };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const calculateItemTotal = (item) => {
    const sub = item.price * item.quantity;
    let disc = 0;
    if (item.discountType === '%') {
      disc = sub * (item.discountValue / 100);
    } else {
      disc = item.discountValue;
    }
    return Math.max(0, sub - disc);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = cart.reduce((sum, item) => {
    const sub = item.price * item.quantity;
    if (item.discountType === '%') return sum + (sub * (item.discountValue / 100));
    return sum + item.discountValue;
  }, 0);
  const total = subtotal - totalDiscount;

  const mutation = useMutation({
    mutationFn: (transactionData) => {
      return fetchApi('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      setLocation(`/kasir/struk/${data.id}`);
    },
    onError: (error) => {
      alert(`Gagal transaksi: ${error.message}`);
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    
    const transactionData = {
      transactionType: 'Penjualan',
      description: 'Penjualan POS',
      debit: total,
      credit: 0,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discountType === '%' ? (item.price * item.quantity * (item.discountValue / 100)) : item.discountValue
      }))
    };
    
    mutation.mutate(transactionData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const categories = useMemo(() => {
    const cats = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
    return cats.length > 1 ? cats : ['Semua', 'Insektisida', 'Herbisida', 'Pupuk', 'Fungisida', 'Benih', 'Alat'];
  }, [products]);

  return (
    <>
      {/* Left Panel: Product Grid & Search Results (Fluid) */}
      <div className="flex-1 flex flex-col border-r border-outline-variant bg-surface-container-lowest overflow-hidden">
        {/* Top Bar: Search + Sort */}
        <div className="px-4 pt-3 pb-2 border-b border-outline-variant bg-surface-container-lowest shrink-0 flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Cari barang (nama/kategori/barcode)..."
              className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-lg font-table-data text-table-data text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setSortAZ(s => !s)}
            title={sortAZ ? 'Sort A-Z aktif (klik untuk nonaktifkan)' : 'Sort A-Z'}
            className={`px-3 py-2 rounded-lg border text-sm font-semibold flex items-center gap-1 transition-colors ${
              sortAZ
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-variant'
            }`}
          >
            Nama A&#8209;Z
          </button>
        </div>
        {/* Category Chips */}
        <div className="px-4 py-2 border-b border-outline-variant bg-surface-container-lowest shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-1.5 rounded-full font-label-caps text-label-caps border text-xs font-bold transition-colors ${
                  filterCategory === cat
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-variant'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        {/* Products Grid */}
        <div className="flex-grow overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 align-top items-start">
          {isLoading ? (
            <div className="col-span-full p-8 text-center text-on-surface-variant">Memuat produk...</div>
          ) : filteredProducts.length === 0 ? (
             <div className="col-span-full p-8 text-center text-on-surface-variant">Tidak ada produk.</div>
          ) : filteredProducts.map(product => (
            <div 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-surface border border-outline-variant rounded-lg p-3 hover:border-primary cursor-pointer transition-colors flex flex-col gap-2 h-full shadow-sm"
            >
              <div className="aspect-square bg-surface-container-low rounded flex items-center justify-center relative overflow-hidden">
                <span className="material-symbols-outlined text-4xl text-primary-container opacity-50">shopping_bag</span>
                <div className={`absolute top-1 right-1 px-1 rounded-sm text-[10px] font-bold ${product.stock <= 10 ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                  STOK: {product.stock}
                </div>
              </div>
              <div className="font-table-data text-table-data font-semibold leading-tight line-clamp-2">{product.name}</div>
              <div className="mt-auto pt-2 flex justify-between items-end">
                <span className="font-body-md text-primary font-bold">{formatCurrency(product.sellingPrice)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Right Panel: Cart & Checkout (Fixed Width) */}
      <div className="w-[400px] flex flex-col bg-surface shrink-0 h-full relative border-l border-outline-variant">
        {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
        
        {/* Customer Panel */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="font-status-label text-status-label text-on-surface">Data Pelanggan (Opsional)</span>
            <button onClick={() => setShowCalc(!showCalc)} className="text-primary hover:text-primary-container text-sm font-table-data flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">calculate</span> Kalkulator
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">person_search</span>
            <input className="w-full h-8 pl-9 pr-2 bg-surface border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary font-table-data text-table-data outline-none text-sm" placeholder="Cari member / no telp..." type="text" />
          </div>
        </div>
        {/* Cart Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant bg-surface-variant shrink-0">
          <span className="font-headline-md text-headline-md font-bold text-on-surface text-lg">Daftar Belanja</span>
          <button onClick={clearCart} className="text-error hover:text-error-container text-sm font-table-data flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">delete_sweep</span> Kosongkan
          </button>
        </div>
        {/* Cart Items (Dense List) */}
        <div className="flex-grow overflow-y-auto bg-surface-container-lowest">
          {cart.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">Keranjang kosong. Silakan pilih produk.</div>
          ) : cart.map(item => (
            <div key={item.productId} className="border-b border-outline-variant p-3 flex flex-col gap-2 relative">
              <div className="flex justify-between items-start gap-2 pr-6">
                <div className="font-table-data text-table-data font-semibold leading-tight">{item.name}</div>
                <div className="font-table-data text-table-data text-right whitespace-nowrap">{formatCurrency(item.price)}</div>
              </div>
              <button onClick={() => removeFromCart(item.productId)} className="absolute top-3 right-3 text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <div className="flex justify-between items-center mt-1">
                {/* Qty Picker */}
                <div className="flex items-center border border-outline-variant rounded h-8">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="px-2 h-full text-on-surface-variant hover:bg-surface-variant flex items-center justify-center border-r border-outline-variant">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <input className="w-10 h-full text-center font-label-caps text-label-caps bg-surface border-none p-0 focus:ring-0" type="text" readOnly value={item.quantity} />
                  <button onClick={() => updateQuantity(item.productId, 1)} className="px-2 h-full text-on-surface-variant hover:bg-surface-variant flex items-center justify-center border-l border-outline-variant">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                {/* Discount Input */}
                <div className="flex items-center gap-1">
                  <span className="font-label-caps text-[10px] text-on-surface-variant">Disc:</span>
                  <div className="flex border border-outline-variant rounded h-8 overflow-hidden w-24 focus-within:border-primary">
                    <input 
                      className="w-full h-full text-right font-table-data text-sm bg-surface border-none px-2 py-0 focus:ring-0" 
                      placeholder="0" 
                      type="number"
                      value={item.discountValue || ''}
                      onChange={(e) => updateDiscount(item.productId, e.target.value, item.discountType)}
                    />
                    <select 
                      className="bg-surface-variant text-on-surface font-label-caps text-[10px] border-l border-outline-variant px-1 focus:ring-0 border-none outline-none cursor-pointer"
                      value={item.discountType}
                      onChange={(e) => updateDiscount(item.productId, item.discountValue, e.target.value)}
                    >
                      <option value="%">%</option>
                      <option value="Rp">Rp</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 items-center mt-1 border-t border-outline-variant border-dashed pt-1">
                {(item.discountValue > 0) && (
                  <span className="text-xs text-on-surface-variant line-through">{formatCurrency(item.price * item.quantity)}</span>
                )}
                <span className="font-table-data text-table-data font-bold text-primary">{formatCurrency(calculateItemTotal(item))}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Checkout Panel (Bottom) */}
        <div className="bg-surface-container-low border-t border-outline-variant p-4 shrink-0 flex flex-col gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant font-table-data">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} item)</span>
            <span className="font-table-data text-on-surface">{formatCurrency(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center text-sm text-error">
              <span className="font-table-data">Total Diskon</span>
              <span className="font-table-data">- {formatCurrency(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between items-end mb-2">
            <span className="font-headline-md text-lg text-on-surface">Total</span>
            <span className="font-headline-lg text-headline-lg text-primary">{formatCurrency(total)}</span>
          </div>
          <button 
            onClick={handleCheckout} 
            disabled={mutation.isPending || cart.length === 0}
            className="w-full bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-headline-md text-headline-md text-lg py-3 rounded-lg border-2 border-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">payments</span>
            {mutation.isPending ? 'MEMPROSES...' : 'BAYAR SEKARANG'}
          </button>
        </div>
      </div>
    </>
  );
}

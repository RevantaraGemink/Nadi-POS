import { useLocation, useRoute } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api';

export default function PratinjauStruk() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/kasir/struk/:id");
  const id = params?.id;

  const { data: transaction, isLoading, isError } = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => fetchApi(`/transactions/${id}`),
    enabled: !!id
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  if (isLoading) return <div className="p-8 text-center text-on-surface-variant">Memuat nota...</div>;
  if (isError || !transaction) return <div className="p-8 text-center text-error">Nota tidak ditemukan.</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-surface p-margin-page flex justify-center items-start w-full">
      <div className="flex flex-col gap-6 w-full max-w-md">
        {/* Back Action */}
        <div className="flex items-center gap-2 mb-[-16px]">
          <button onClick={() => setLocation('/')} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          </button>
          <span className="font-body-md text-body-md text-on-surface font-medium cursor-pointer" onClick={() => setLocation('/')}>Kembali ke Transaksi</span>
        </div>
        {/* Action Bar (Top of Receipt) */}
        <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-lg border border-outline-variant">
          <h2 className="font-headline-md text-body-lg font-bold text-on-surface">Pratinjau Struk</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-primary border-2 border-primary text-on-primary font-table-data text-table-data font-bold rounded transition-colors hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
              Cetak Struk
            </button>
          </div>
        </div>
        {/* Receipt Paper Simulation */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-sm p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] font-label-caps text-on-surface w-full mx-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {/* Store Info */}
          <div className="text-center mb-6">
            <h3 className="font-headline-md text-headline-md font-bold text-primary mb-1">AGRIPOS</h3>
            <p className="text-[11px] leading-tight text-on-surface-variant">Sistem Point of Sale Pertanian</p>
          </div>
          <div className="border-b border-dashed border-outline-variant mb-4"></div>
          {/* Meta Data */}
          <div className="flex flex-col gap-1 mb-4 text-[11px]">
            <div className="flex justify-between">
              <span>No. Struk</span>
              <span>#TRX-{transaction.id.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{formatDate(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipe</span>
              <span>{transaction.transactionType}</span>
            </div>
          </div>
          <div className="border-b border-dashed border-outline-variant mb-4"></div>
          {/* Items Header */}
          <div className="grid grid-cols-12 gap-2 mb-2 text-[11px] font-bold border-b border-outline-variant pb-2">
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-5 text-right">Subtotal</div>
          </div>
          {/* Items List */}
          <div className="flex flex-col gap-3 mb-4 text-[11px]">
            {transaction.items && transaction.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 font-bold text-on-surface">{item.productName || 'Produk'}</div>
                <div className="col-span-5 text-on-surface-variant pl-2">@ {formatCurrency(item.price)}</div>
                <div className="col-span-2 text-center">{item.quantity}</div>
                <div className="col-span-5 text-right">{formatCurrency(item.price * item.quantity)}</div>
                {item.discount > 0 && (
                  <div className="col-span-12 grid grid-cols-12 gap-2 text-secondary">
                    <div className="col-span-7 pl-2">Diskon</div>
                    <div className="col-span-5 text-right">-{formatCurrency(item.discount)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-b border-dashed border-outline-variant mb-4"></div>
          {/* Totals */}
          <div className="flex flex-col gap-1 mb-6 text-[12px]">
            <div className="flex justify-between font-bold text-[14px] mt-1 text-primary">
              <span>GRAND TOTAL</span>
              <span>{formatCurrency(transaction.debit || transaction.credit)}</span>
            </div>
          </div>
          {/* Footer */}
          <div className="text-center text-[11px] text-on-surface-variant flex flex-col gap-1 mt-8">
            <p className="font-bold text-on-surface">Terima Kasih</p>
            <p className="mt-2 text-[9px] text-outline">Powered by AgriPOS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

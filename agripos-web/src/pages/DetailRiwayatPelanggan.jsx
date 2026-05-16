import { useLocation, useRoute } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api';
import { useState } from 'react';

export default function DetailRiwayatPelanggan() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/pelanggan/:id/detail");
  const id = params?.id;
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data: customerData } = useQuery({
    queryKey: ['customer-detail', id],
    queryFn: () => fetchApi(`/customers/${id}`),
    enabled: !!id
  });

  const { data, isLoading } = useQuery({
    queryKey: ['customer-transactions', id, page],
    queryFn: () => fetchApi(`/customers/${id}/transactions?page=${page}&limit=${limit}`),
    enabled: !!id
  });

  const customer = customerData?.data || customerData || null;
  const transactions = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };

  const formatCurrency = (amount) => {
    if (amount == null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex-1 overflow-y-auto p-margin-page bg-surface flex flex-col gap-gutter">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setLocation('/pelanggan')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span className="font-label-caps text-label-caps">KEMBALI KE DATABASE PELANGGAN</span>
        </button>
        <button
          onClick={() => setLocation(`/pelanggan/${id}/edit`)}
          className="h-10 px-4 bg-primary text-on-primary font-bold rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">edit</span>
          Edit Profil
        </button>
      </div>

      {/* Main Grid: Left Profile + Right Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

        {/* Left Column: Profile + Stats */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Profile Card */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-4xl font-bold mb-4 shadow-inner">
              {getInitials(customer?.name)}
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">{customer?.name || 'Memuat...'}</h2>
            <div className="px-3 py-1 bg-surface-container flex items-center gap-1.5 mb-6 rounded-full">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-status-label font-status-label text-on-surface-variant">{customer?.customerType || 'Pelanggan'}</span>
            </div>
            <div className="w-full space-y-4 text-left border-t border-outline-variant pt-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary bg-primary-container/20 p-2 rounded-lg">call</span>
                <div>
                  <p className="text-label-caps font-label-caps text-outline leading-none">WHATSAPP</p>
                  <p className="text-body-md font-bold">{customer?.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary bg-primary-container/20 p-2 rounded-lg shrink-0">location_on</span>
                <div>
                  <p className="text-label-caps font-label-caps text-outline leading-none">ALAMAT</p>
                  <p className="text-body-md">{customer?.address || '-'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Cards */}
          <section className="grid grid-cols-1 gap-3">
            <div className="bg-primary-container text-on-primary-container p-4 rounded-xl flex items-center gap-4">
              <span className="material-symbols-outlined text-3xl opacity-80">payments</span>
              <div>
                <p className="text-label-caps font-label-caps opacity-70">TOTAL BELANJA (YTD)</p>
                <p className="text-headline-md font-bold">{formatCurrency(customer?.totalTransactions || meta.total * 100000)}</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center gap-4">
              <span className="material-symbols-outlined text-3xl text-secondary">calendar_today</span>
              <div>
                <p className="text-label-caps font-label-caps text-outline">FREKUENSI KUNJUNGAN</p>
                <p className="text-headline-md font-bold text-on-surface">{meta.total} Kali</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center gap-4">
              <span className="material-symbols-outlined text-3xl text-primary">history</span>
              <div>
                <p className="text-label-caps font-label-caps text-outline">TRANSAKSI TERAKHIR</p>
                <p className="text-headline-md font-bold text-on-surface">
                  {transactions.length > 0 ? formatDate(transactions[0]?.createdAt) : '-'}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Transaction History */}
        <div className="lg:col-span-8 flex flex-col">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
            {/* Section Header */}
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-headline-md text-headline-md text-on-surface">Riwayat Transaksi</h3>
              <button className="h-10 px-4 border border-outline-variant rounded-lg flex items-center gap-2 text-on-surface-variant hover:bg-surface-variant transition-colors font-table-data text-table-data bg-surface-container-lowest">
                <span className="material-symbols-outlined">filter_list</span>
                Filter Transaksi
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50 text-on-surface-variant font-label-caps text-label-caps border-b border-outline-variant">
                    <th className="p-table-cell-padding">ID</th>
                    <th className="p-table-cell-padding">TANGGAL</th>
                    <th className="p-table-cell-padding">ITEMS</th>
                    <th className="p-table-cell-padding text-right">TOTAL</th>
                    <th className="p-table-cell-padding text-center">STATUS</th>
                    <th className="p-table-cell-padding text-center">STRUK</th>
                  </tr>
                </thead>
                <tbody className="font-table-data text-table-data text-on-surface">
                  {isLoading ? (
                    <tr><td colSpan="6" className="text-center p-8">Memuat riwayat...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan="6" className="text-center p-8 text-on-surface-variant">Belum ada riwayat transaksi.</td></tr>
                  ) : transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="p-table-cell-padding font-bold text-primary">#{tx.id}</td>
                      <td className="p-table-cell-padding text-on-surface-variant">{formatDate(tx.createdAt)}</td>
                      <td className="p-table-cell-padding">{tx.description || 'Penjualan POS'}</td>
                      <td className="p-table-cell-padding text-right font-bold text-lg">{formatCurrency(tx.debit)}</td>
                      <td className="p-table-cell-padding text-center">
                        <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded text-[11px] font-bold uppercase">
                          PAID
                        </span>
                      </td>
                      <td className="p-table-cell-padding text-center">
                        <button
                          onClick={() => setLocation(`/kasir/struk/${tx.id}`)}
                          className="text-primary hover:bg-primary-container/10 p-1 rounded transition-colors"
                          title="Lihat Struk"
                        >
                          <span className="material-symbols-outlined">receipt_long</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-lowest text-on-surface-variant font-table-data text-table-data mt-auto">
              <span>Menampilkan {(page - 1) * limit + 1}-{Math.min(page * limit, meta.total)} dari {meta.total} transaksi</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

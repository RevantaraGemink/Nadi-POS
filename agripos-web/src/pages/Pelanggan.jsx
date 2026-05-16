import { useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api';
import { useState, useMemo } from 'react';

export default function Pelanggan() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name_az');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', page],
    queryFn: () => fetchApi(`/customers?page=${page}&limit=${limit}`)
  });

  const customers = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };

  const sortOptions = [
    { value: 'name_az', label: 'Nama (A-Z)' },
    { value: 'name_za', label: 'Nama (Z-A)' },
    { value: 'last_purchase', label: 'Terakhir Belanja' },
    { value: 'total_transaction', label: 'Total Transaksi' },
  ];

  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    }
    if (sortOrder === 'name_az') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOrder === 'name_za') list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [customers, searchQuery, sortOrder]);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const currentSortLabel = sortOptions.find(o => o.value === sortOrder)?.label || 'Urutkan';

  return (
    <div className="flex-1 overflow-y-auto p-margin-page bg-surface flex flex-col gap-gutter">
      {/* Actions & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 justify-start">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            className="w-full h-input-height pl-10 pr-4 bg-surface-container-lowest border border-outline rounded text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:border-2 transition-all placeholder:text-outline"
            placeholder="Cari nama atau nomor WhatsApp..."
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(s => !s)}
            className="flex items-center gap-2 bg-surface-container-lowest text-on-surface-variant px-4 h-input-height rounded border border-outline hover:bg-surface-variant transition-colors whitespace-nowrap font-body-md"
          >
            <span className="material-symbols-outlined text-[20px]">sort</span>
            <span>{currentSortLabel}</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute left-0 mt-1 w-48 bg-surface-container-lowest border border-outline-variant rounded shadow-lg z-20">
                <ul className="py-1">
                  {sortOptions.map(opt => (
                    <li key={opt.value}>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-surface-variant transition-colors ${sortOrder === opt.value ? 'text-primary font-bold' : 'text-on-surface'}`}
                        onClick={() => { setSortOrder(opt.value); setShowSortDropdown(false); }}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={() => setLocation('/pelanggan/tambah')}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 h-input-height rounded font-status-label text-status-label hover:bg-on-primary-fixed-variant transition-colors whitespace-nowrap border-2 border-primary sm:ml-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Pelanggan
        </button>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden flex-1 flex flex-col shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container sticky top-0 z-10 border-b border-outline-variant">
              <tr>
                <th className="p-table-cell-padding font-status-label text-status-label text-on-surface-variant w-[250px]">Nama Pelanggan</th>
                <th className="p-table-cell-padding font-status-label text-status-label text-on-surface-variant w-[180px]">WhatsApp</th>
                <th className="p-table-cell-padding font-status-label text-status-label text-on-surface-variant">Alamat</th>
                <th className="p-table-cell-padding font-status-label text-status-label text-on-surface-variant w-[140px]">Terakhir Belanja</th>
                <th className="p-table-cell-padding font-status-label text-status-label text-on-surface-variant text-right w-[150px]">Total Transaksi</th>
                <th className="p-table-cell-padding font-status-label text-status-label text-on-surface-variant text-center w-[80px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="font-table-data text-table-data text-on-surface">
              {isLoading ? (
                <tr><td colSpan="6" className="text-center p-8 text-on-surface-variant">Loading data...</td></tr>
              ) : isError ? (
                <tr><td colSpan="6" className="text-center p-8 text-error">Gagal memuat data pelanggan.</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-on-surface-variant">
                  {searchQuery ? 'Pelanggan tidak ditemukan.' : 'Belum ada pelanggan.'}
                </td></tr>
              ) : filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b border-outline-variant zebra-row hover:bg-surface-container transition-colors">
                  <td className="p-table-cell-padding">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary-fixed text-on-primary-container flex items-center justify-center font-bold shrink-0">
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <div className="font-bold">{customer.name}</div>
                        <div className="text-xs text-on-surface-variant font-normal">{customer.customerType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-table-cell-padding text-on-surface-variant">{customer.phone || '-'}</td>
                  <td className="p-table-cell-padding text-on-surface-variant truncate max-w-[200px]" title={customer.address}>{customer.address || '-'}</td>
                  <td className="p-table-cell-padding text-on-surface-variant">{formatDate(customer.lastTransaction)}</td>
                  <td className="p-table-cell-padding text-right font-bold">{formatCurrency(customer.totalTransactions)}</td>
                  <td className="p-table-cell-padding text-center">
                    <button
                      onClick={() => setLocation(`/pelanggan/${customer.id}/detail`)}
                      className="text-primary hover:text-surface-tint p-1 rounded hover:bg-surface-variant transition-colors"
                      title="Lihat Riwayat"
                    >
                      <span className="material-symbols-outlined text-[20px]">history</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination / Footer */}
        <div className="bg-surface-container border-t border-outline-variant p-2 flex justify-between items-center text-sm text-on-surface-variant font-body-md">
          <span className="pl-2">Menampilkan {filteredCustomers.length} dari {meta.total} pelanggan</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest text-outline hover:bg-surface-variant transition-colors flex items-center justify-center disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="p-1 w-8 h-8 rounded border border-primary bg-primary text-on-primary text-xs font-bold">{meta.page}</button>
            {meta.totalPages > 1 && Array.from({ length: Math.min(meta.totalPages - 1, 2) }, (_, i) => (
              <button
                key={i + 2}
                onClick={() => setPage(i + 2)}
                className="p-1 w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center"
              >{i + 2}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="p-1 w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

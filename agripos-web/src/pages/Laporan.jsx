import { useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api';
import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PERIODS = [
  { key: 'hari_ini',   label: 'Harian' },
  { key: 'minggu_ini', label: 'Mingguan' },
  { key: 'bulan_ini',  label: 'Bulanan' },
  { key: 'tahun_ini',  label: 'Tahunan' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

// Komponen mini bar chart untuk tren laba 7 hari
function TrendBarChart({ transactions }) {
  // Hitung laba per hari 7 hari terakhir dari data transaksi
  const today = new Date();
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Buat 7 titik data (hari ini ke belakang)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayLabel = days[d.getDay()];
    const isToday = i === 6;

    // Hitung net dari transaksi di hari itu
    const dateStr = d.toISOString().split('T')[0];
    const net = transactions
      .filter(tx => tx.createdAt && tx.createdAt.startsWith(dateStr))
      .reduce((sum, tx) => sum + (tx.debit || 0) - (tx.credit || 0), 0);

    return { dayLabel, net, isToday };
  });

  const maxVal = Math.max(...chartData.map(d => Math.abs(d.net)), 1);

  return (
    <div className="flex-1 flex items-end gap-2 p-2 border-b border-l border-outline-variant relative min-h-[120px]">
      {/* Y-axis labels */}
      <div className="absolute -left-2 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant font-label-caps -translate-x-full pr-1 pointer-events-none">
        <span>{maxVal >= 1000000 ? `${(maxVal/1000000).toFixed(0)}M` : maxVal >= 1000 ? `${(maxVal/1000).toFixed(0)}K` : maxVal}</span>
        <span>{maxVal >= 1000000 ? `${(maxVal/2000000).toFixed(1)}M` : maxVal >= 1000 ? `${(maxVal/2000).toFixed(0)}K` : Math.round(maxVal/2)}</span>
        <span>0</span>
      </div>
      {/* Bars */}
      <div className="w-full flex justify-between items-end h-full gap-1">
        {chartData.map((d, i) => {
          const heightPct = maxVal > 0 ? Math.max(4, (Math.abs(d.net) / maxVal) * 100) : 4;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-sm transition-opacity ${
                d.isToday ? 'bg-primary opacity-100 relative' : 'bg-primary opacity-50 hover:opacity-80'
              }`}
              style={{ height: `${heightPct}%` }}
            >
              {d.isToday && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-status-label text-[10px] py-1 px-2 rounded-sm whitespace-nowrap z-10">
                  Hari ini
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Laporan() {
  const [, setLocation] = useLocation();
  const [period, setPeriod]   = useState('bulan_ini');
  const [year, setYear]       = useState(String(CURRENT_YEAR - 1));
  const [cashflowPage, setCashflowPage] = useState(1);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Build query string
  const periodParam = period === 'tahun'
    ? `period=tahun&year=${year}`
    : `period=${period}`;

  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['reports-summary', period, year],
    queryFn: () => fetchApi(`/reports/summary?${periodParam}`),
  });

  const { data: cashflowData, isLoading: loadingCashflow } = useQuery({
    queryKey: ['reports-cashflow', period, year, cashflowPage],
    queryFn: () => fetchApi(`/reports/cashflow?${periodParam}&page=${cashflowPage}&limit=10`),
  });

  // Ambil semua transaksi untuk chart (tanpa paginasi)
  const { data: allCashflowData } = useQuery({
    queryKey: ['reports-cashflow-all', period, year],
    queryFn: () => fetchApi(`/reports/cashflow?${periodParam}&page=1&limit=9999`),
  });

  const summary      = summaryData  || { totalPemasukan: 0, totalPengeluaran: 0, labaBersih: 0, totalTransaksi: 0 };
  const transactions = cashflowData?.data || [];
  const allTransactions = allCashflowData?.data || [];
  const meta         = cashflowData?.meta || { total: 0, totalPages: 1, page: 1 };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0);

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const periodLabel = useMemo(() => {
    if (period === 'tahun') return `Tahun ${year}`;
    return PERIODS.find(p => p.key === period)?.label ?? period;
  }, [period, year]);

  const handlePeriodChange = (key) => {
    setPeriod(key);
    setCashflowPage(1);
    setShowYearPicker(false);
  };

  // Hitung pengeluaran per kategori
  const expenseByCategory = useMemo(() => {
    const map = {};
    allTransactions.forEach(tx => {
      if (tx.credit > 0) {
        const cat = tx.transactionType || 'Lainnya';
        map[cat] = (map[cat] || 0) + tx.credit;
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [allTransactions]);

  const maxCategoryValue = expenseByCategory.length > 0 ? expenseByCategory[0][1] : 1;

  const profitMarginPct = summary.totalPemasukan > 0
    ? Math.max(0, Math.min(100, (summary.labaBersih / summary.totalPemasukan) * 100))
    : 0;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(1, 45, 29);
    doc.text('AgriPOS - Laporan Keuangan', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Periode: ${periodLabel}`, 14, 28);
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 34);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Ringkasan Keuangan', 14, 44);

    autoTable(doc, {
      startY: 49,
      head: [['Kategori', 'Total']],
      body: [
        ['Total Transaksi',  `${summary.totalTransaksi} transaksi`],
        ['Total Pemasukan',  formatCurrency(summary.totalPemasukan)],
        ['Total Pengeluaran',formatCurrency(summary.totalPengeluaran)],
        ['Laba Bersih',      formatCurrency(summary.labaBersih)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [1, 45, 29] },
      styles: { fontSize: 11, cellPadding: 4 },
    });

    const y1 = doc.lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.text('Arus Kas', 14, y1 + 12);

    autoTable(doc, {
      startY: y1 + 17,
      head: [['Waktu', 'Keterangan', 'Kategori', 'Debit', 'Kredit']],
      body: transactions.map(tx => [
        new Date(tx.createdAt).toLocaleDateString('id-ID'),
        tx.description,
        tx.transactionType,
        tx.debit  > 0 ? formatCurrency(tx.debit)  : '-',
        tx.credit > 0 ? formatCurrency(tx.credit) : '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [1, 45, 29] },
      styles: { fontSize: 9 },
    });

    doc.save(`Laporan_AgriPOS_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-margin-page bg-surface">
      <div className="max-w-[1400px] mx-auto space-y-gutter">

        {/* ── Page Header + Period Switcher (inline, sesuai desain) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Laporan Keuangan</h1>
            <p className="text-on-surface-variant mt-1">Ringkasan transaksi dan arus kas operasional.</p>
          </div>

          {/* Period Switcher + Calendar */}
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-container-low border border-outline-variant rounded-DEFAULT p-1 w-fit">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => handlePeriodChange(p.key)}
                  className={`px-4 py-1.5 rounded-DEFAULT font-table-data text-table-data transition-colors ${
                    period === p.key
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Calendar/Year picker button */}
            <div className="relative">
              <button
                onClick={() => setShowYearPicker(v => !v)}
                className="flex items-center justify-center p-2 rounded-DEFAULT border border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                title="Pilih Tahun"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              </button>
              {showYearPicker && (
                <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-md z-20 py-1 min-w-[120px]">
                  {YEAR_OPTIONS.map(y => (
                    <button
                      key={y}
                      onClick={() => { setPeriod('tahun'); setYear(String(y)); setCashflowPage(1); setShowYearPicker(false); }}
                      className={`w-full text-left px-4 py-2 text-sm font-table-data transition-colors flex justify-between items-center ${
                        period === 'tahun' && year === String(y)
                          ? 'bg-primary text-on-primary font-bold'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span>{y}</span>
                      {y === CURRENT_YEAR && (
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded ml-2">Skrg</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Bento Grid (3 kartu sesuai desain) ── */}
        {loadingSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface-container-low border border-outline-variant rounded-DEFAULT p-6 h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">

            {/* Total Pemasukan */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="font-table-data text-table-data text-on-surface-variant">Total Pemasukan</h3>
                <div className="bg-primary-container text-on-primary-container p-2 rounded-DEFAULT flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </div>
              </div>
              <div>
                <p className="font-headline-lg text-headline-lg text-primary">{formatCurrency(summary.totalPemasukan)}</p>
                <p className="font-status-label text-status-label text-secondary flex items-center gap-1 mt-2">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  {summary.totalTransaksi} transaksi
                </p>
              </div>
            </div>

            {/* Total Pengeluaran */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="font-table-data text-table-data text-on-surface-variant">Total Pengeluaran</h3>
                <div className="bg-error-container text-on-error-container p-2 rounded-DEFAULT flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </div>
              </div>
              <div>
                <p className="font-headline-lg text-headline-lg text-error">{formatCurrency(summary.totalPengeluaran)}</p>
                <p className="font-status-label text-status-label text-error flex items-center gap-1 mt-2">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  operasional &amp; pembelian
                </p>
              </div>
            </div>

            {/* Laba Bersih — full green card */}
            <div className={`rounded-DEFAULT p-6 flex flex-col gap-4 relative overflow-hidden border ${
              summary.labaBersih >= 0 ? 'bg-primary border-primary text-on-primary' : 'bg-error border-error text-on-error'
            }`}>
              <div className="absolute -right-6 -top-6 opacity-10">
                <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance_wallet
                </span>
              </div>
              <div className="flex justify-between items-start relative z-10">
                <h3 className="font-table-data text-table-data text-on-primary-container">Laba Bersih</h3>
              </div>
              <div className="relative z-10">
                <p className="font-headline-lg text-headline-lg">{formatCurrency(summary.labaBersih)}</p>
                {summary.totalPemasukan > 0 && (
                  <>
                    <div className="mt-4 w-full bg-on-primary-fixed-variant h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-secondary-fixed h-full transition-all duration-500"
                        style={{ width: `${profitMarginPct}%` }}
                      />
                    </div>
                    <p className="font-table-data text-table-data text-on-primary-container mt-2 text-sm">
                      {profitMarginPct.toFixed(1)}% Profit Margin
                    </p>
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── Main Content: Tabel + Panel Kanan ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

          {/* Cash Flow Table (2 kolom) */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-table-data text-table-data text-on-surface font-bold">Arus Kas (Cash Flow)</h3>
              <button
                onClick={() => setLocation('/laporan/input')}
                className="flex items-center gap-2 border-2 border-primary text-primary px-3 py-1.5 rounded-DEFAULT font-table-data text-table-data hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Input Pengeluaran
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container font-label-caps text-label-caps text-on-surface-variant sticky top-0">
                  <tr>
                    <th className="p-table-cell-padding font-bold border-b border-outline-variant">Waktu</th>
                    <th className="p-table-cell-padding font-bold border-b border-outline-variant">Keterangan</th>
                    <th className="p-table-cell-padding font-bold border-b border-outline-variant">Kategori</th>
                    <th className="p-table-cell-padding font-bold border-b border-outline-variant text-right">Debit (Masuk)</th>
                    <th className="p-table-cell-padding font-bold border-b border-outline-variant text-right">Kredit (Keluar)</th>
                  </tr>
                </thead>
                <tbody className="font-table-data text-table-data">
                  {loadingCashflow ? (
                    <tr><td colSpan="5" className="text-center p-6 text-on-surface-variant">Memuat data...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-8">
                        <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-4xl opacity-40">receipt_long</span>
                          <p className="font-medium">Tidak ada transaksi untuk periode ini</p>
                        </div>
                      </td>
                    </tr>
                  ) : transactions.map((tx, idx) => (
                    <tr
                      key={tx.id}
                      className={`border-b border-surface-variant hover:bg-surface-container-lowest transition-colors h-[48px] ${
                        idx % 2 === 1 ? 'bg-surface' : ''
                      }`}
                    >
                      <td className="p-table-cell-padding text-on-surface-variant whitespace-nowrap">{formatTime(tx.createdAt)}</td>
                      <td className="p-table-cell-padding font-medium max-w-[200px] truncate" title={tx.description}>{tx.description}</td>
                      <td className="p-table-cell-padding">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm font-status-label text-[11px] ${
                          tx.debit > 0
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="p-table-cell-padding text-right text-primary font-semibold">
                        {tx.debit > 0 ? formatCurrency(tx.debit) : '-'}
                      </td>
                      <td className="p-table-cell-padding text-right text-error font-semibold">
                        {tx.credit > 0 ? formatCurrency(tx.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-auto p-4 border-t border-outline-variant bg-surface-container-low flex justify-between items-center font-table-data text-table-data">
              <span className="text-on-surface-variant">
                {meta.total > 0
                  ? `Menampilkan ${(cashflowPage - 1) * 10 + 1}–${Math.min(cashflowPage * 10, meta.total)} dari ${meta.total} transaksi`
                  : '0 data'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCashflowPage(p => Math.max(1, p - 1))}
                  disabled={cashflowPage === 1}
                  className="p-1 rounded-DEFAULT border border-outline-variant text-on-surface hover:bg-surface disabled:opacity-40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  onClick={() => setCashflowPage(p => Math.min(meta.totalPages || 1, p + 1))}
                  disabled={cashflowPage >= (meta.totalPages || 1)}
                  className="p-1 rounded-DEFAULT border border-outline-variant text-on-surface hover:bg-surface disabled:opacity-40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Chart + Kategori + PDF */}
          <div className="flex flex-col gap-gutter">

            {/* Bar Chart: Tren Laba 7 Hari */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 flex flex-col h-64">
              <h3 className="font-table-data text-table-data text-on-surface font-bold mb-4">
                Tren Laba (7 Hari Terakhir)
              </h3>
              <TrendBarChart transactions={allTransactions} />
              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant font-label-caps px-2">
                {(() => {
                  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
                  return Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return <span key={i}>{days[d.getDay()]}</span>;
                  });
                })()}
              </div>
            </div>

            {/* Pengeluaran per Kategori */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 flex-1">
              <h3 className="font-table-data text-table-data text-on-surface font-bold mb-4">
                Pengeluaran per Kategori
              </h3>
              <div className="space-y-4">
                {expenseByCategory.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Tidak ada data pengeluaran.</p>
                ) : expenseByCategory.map(([cat, total]) => (
                  <div key={cat}>
                    <div className="flex justify-between font-table-data text-table-data text-sm mb-1">
                      <span className="text-on-surface truncate max-w-[140px]">{cat}</span>
                      <span className="font-bold">{formatCurrency(total)}</span>
                    </div>
                    <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-outline h-full transition-all duration-500"
                        style={{ width: `${(total / maxCategoryValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleDownloadPDF}
                disabled={loadingSummary || loadingCashflow}
                className="w-full mt-6 bg-surface border-2 border-outline-variant text-on-surface font-table-data text-table-data font-bold py-2 rounded-DEFAULT hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Unduh Laporan (PDF)
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

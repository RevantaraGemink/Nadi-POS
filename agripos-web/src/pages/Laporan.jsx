import { useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../api';
import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PERIODS = [
  { key: 'hari_ini',   label: 'Harian' },
  { key: 'minggu_ini', label: 'Mingguan' },
  { key: 'bulan_ini',  label: 'Bulan' },
];

const CURRENT_YEAR = new Date().getFullYear();

// Komponen mini bar chart untuk tren laba 7 hari
function TrendBarChart({ transactions }) {
  const today = new Date();
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayLabel = days[d.getDay()];
    const isToday = i === 6;
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
  const [cashflowPage, setCashflowPage] = useState(1);
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Build query string
  const periodParam = `period=${period}`;

  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['reports-summary', period],
    queryFn: () => fetchApi(`/reports/summary?${periodParam}`),
  });

  const { data: cashflowData, isLoading: loadingCashflow } = useQuery({
    queryKey: ['reports-cashflow', period, cashflowPage],
    queryFn: () => fetchApi(`/reports/cashflow?${periodParam}&page=${cashflowPage}&limit=5`),
  });

  // Ambil semua transaksi untuk chart (tanpa paginasi)
  const { data: allCashflowData } = useQuery({
    queryKey: ['reports-cashflow-all', period],
    queryFn: () => fetchApi(`/reports/cashflow?${periodParam}&page=1&limit=9999`),
  });

  const summary      = summaryData  || { totalPemasukan: 0, totalPengeluaran: 0, labaBersih: 0, totalTransaksi: 0, totalSalesTx: 0, totalProductsSold: 0 };
  const transactions = cashflowData?.data || [];
  const allTransactions = allCashflowData?.data || [];
  const meta         = cashflowData?.meta || { total: 0, totalPages: 1, page: 1 };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  };

  const periodLabel = useMemo(() => {
    return PERIODS.find(p => p.key === period)?.label ?? period;
  }, [period]);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    const now = new Date();
    if (period === 'hari_ini') {
      return now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
    }
    if (period === 'minggu_ini') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const fmt = (d) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
      return `${fmt(start)} - ${fmt(end)}`;
    }
    // bulan_ini
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
    return `${fmt(startOfMonth)} - ${fmt(endOfMonth)}`;
  }, [period]);

  const handlePeriodChange = (key) => {
    setPeriod(key);
    setCashflowPage(1);
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

  const avgPerTransaction = summary.totalSalesTx > 0
    ? summary.totalPemasukan / summary.totalSalesTx
    : 0;
    
  const avgProductsPerTx = summary.totalSalesTx > 0
    ? (summary.totalProductsSold / summary.totalSalesTx).toFixed(1)
    : 0;

  const expensePct = summary.totalPemasukan > 0
    ? ((summary.totalPengeluaran / summary.totalPemasukan) * 100).toFixed(1)
    : 0;

  const PDF_PERIODS = [
    { key: 'hari_ini', label: 'Harian' },
    { key: 'minggu_ini', label: 'Mingguan' },
    { key: 'bulan_ini', label: 'Bulanan' },
  ];

  const handleDownloadPDF = async (pdfPeriod) => {
    setShowPdfMenu(false);
    setPdfLoading(true);
    try {
      const pLabel = PDF_PERIODS.find(p => p.key === pdfPeriod)?.label || pdfPeriod;
      // Fetch fresh data for the chosen period
      const [pdfSummary, pdfCashflow] = await Promise.all([
        fetchApi(`/reports/summary?period=${pdfPeriod}`),
        fetchApi(`/reports/cashflow?period=${pdfPeriod}&page=1&limit=9999`),
      ]);
      const pdfTx = pdfCashflow?.data || [];
      const s = pdfSummary || { totalPemasukan: 0, totalPengeluaran: 0, labaBersih: 0, totalTransaksi: 0 };

      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.setFontSize(16);
      doc.text('Nadi - Laporan Keuangan', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Periode: ${pLabel}`, 14, 28);
      doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 34);

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Ringkasan Keuangan', 14, 44);

      autoTable(doc, {
        startY: 49,
        head: [['Kategori', 'Total']],
        body: [
          ['Total Transaksi',  `${s.totalTransaksi} transaksi`],
          ['Total Pemasukan',  formatCurrency(s.totalPemasukan)],
          ['Total Pengeluaran',formatCurrency(s.totalPengeluaran)],
          ['Laba Bersih',      formatCurrency(s.labaBersih)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [1, 45, 29], textColor: [255, 255, 255] },
        styles: { fontSize: 11, cellPadding: 4, textColor: [0, 0, 0] },
      });

      const y1 = doc.lastAutoTable.finalY;
      doc.setFontSize(14);
      doc.text('Arus Kas', 14, y1 + 12);

      autoTable(doc, {
        startY: y1 + 17,
        head: [['Waktu', 'Keterangan', 'Kategori', 'Debit', 'Kredit']],
        body: pdfTx.map(tx => {
          const d = new Date(tx.createdAt);
          const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          return [
            `${dateStr} ${timeStr}`,
            tx.description,
            tx.transactionType,
            tx.debit  > 0 ? formatCurrency(tx.debit)  : '-',
            tx.credit > 0 ? formatCurrency(tx.credit) : '-',
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [1, 45, 29], textColor: [255, 255, 255] },
        styles: { fontSize: 9, textColor: [0, 0, 0] },
      });

      // Save PDF
      doc.save(`Laporan_Nadi_${pLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      alert('Gagal mengunduh PDF: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-margin-page bg-surface">
      <div className="max-w-[1400px] mx-auto space-y-gutter">

        {/* ── Dashboard Header Section ── */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">Dashboard Penjualan</h1>
            <span className="material-symbols-outlined text-primary cursor-pointer text-[20px]">help</span>
            <span className="material-symbols-outlined text-outline cursor-pointer text-[20px]">star</span>
          </div>
          <p className="text-on-surface-variant text-sm">
            Diperbarui {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </p>

          {/* Period Switcher + Date Range */}
          <div className="flex items-center mt-2">
            <div className="flex bg-surface-container-lowest border border-outline-variant rounded-DEFAULT overflow-hidden mr-4 shadow-sm">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => handlePeriodChange(p.key)}
                  className={`px-5 py-2 font-table-data text-table-data transition-colors border-r border-outline-variant last:border-r-0 ${
                    period === p.key
                      ? 'bg-[#00c99a] text-white font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date Range Selector */}
            <div className="flex bg-surface-container-lowest border border-outline-variant rounded-DEFAULT overflow-hidden shadow-sm">
              <button className="px-3 py-2 hover:bg-surface-container border-r border-outline-variant text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <div className="px-4 py-2 font-table-data text-table-data text-on-surface bg-surface-container-low flex items-center justify-center min-w-[180px]">
                {dateRangeLabel}
              </div>
              <button className="px-3 py-2 hover:bg-surface-container border-l border-outline-variant text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Metrics Grid (3 KPI cards) ── */}
        {loadingSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface-container-low border border-outline-variant rounded-DEFAULT p-6 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-6">
            {/* Total Pemasukan */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-DEFAULT shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <p className="font-table-data text-table-data text-on-surface-variant">Total Pemasukan</p>
                <span className="material-symbols-outlined text-primary">trending_up</span>
              </div>
              <h2 className="text-[28px] font-bold text-primary">{formatCurrency(summary.totalPemasukan)}</h2>
              <p className="text-xs text-on-surface-variant">Periode {periodLabel}</p>
            </div>

            {/* Total Pengeluaran */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-DEFAULT shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <p className="font-table-data text-table-data text-on-surface-variant">Total Pengeluaran</p>
                <span className="material-symbols-outlined text-error">trending_down</span>
              </div>
              <h2 className="text-[28px] font-bold text-on-surface">{formatCurrency(summary.totalPengeluaran)}</h2>
              <p className="text-xs text-on-surface-variant">{expensePct}% dari pemasukan</p>
            </div>

            {/* Laba Bersih */}
            <div className="bg-primary-container p-6 rounded-DEFAULT shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <p className="font-table-data text-table-data text-on-primary-container opacity-80">Laba Bersih (Net)</p>
                <span className="material-symbols-outlined text-on-primary-container">payments</span>
              </div>
              <h2 className="text-[28px] font-bold text-on-primary-container">{formatCurrency(summary.labaBersih)}</h2>
              <p className="text-xs text-on-primary-container opacity-80">Profit Margin: {profitMarginPct.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="font-table-data text-table-data text-on-surface-variant text-sm">Transaksi</p>
              <p className="text-xl font-semibold text-on-surface">{summary.totalTransaksi}</p>
            </div>
            <div>
              <p className="font-table-data text-table-data text-on-surface-variant text-sm">Penjualan per Transaksi</p>
              <p className="text-xl font-semibold text-on-surface">{formatCurrency(avgPerTransaction)}</p>
            </div>
            <div>
              <p className="font-table-data text-table-data text-on-surface-variant text-sm">Produk Terjual</p>
              <p className="text-xl font-semibold text-on-surface">{summary.totalProductsSold} item</p>
            </div>
            <div>
              <p className="font-table-data text-table-data text-on-surface-variant text-sm">Produk per Transaksi</p>
              <p className="text-xl font-semibold text-on-surface">{avgProductsPerTx} item</p>
            </div>
          </div>
        </div>

        {/* ── "Penjualan" Section Header ── */}
        <div className="mt-8 mb-4">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface inline-block mr-2">Penjualan</h3>
          <span className="text-on-surface-variant text-sm">{dateRangeLabel}</span>
        </div>

        {/* ── Main Content: Tabel + Panel Kanan ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-4">

          {/* Cash Flow Table (2 kolom) */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-table-data text-table-data text-on-surface font-bold">Arus Kas (Cash Flow)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocation('/laporan/input-pemasukan')}
                  className="flex items-center gap-1.5 border-2 border-[#00c99a] text-[#00c99a] px-3 py-1.5 rounded-DEFAULT font-table-data text-table-data hover:bg-[#00c99a]/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Input Pemasukan
                </button>
                <button
                  onClick={() => setLocation('/laporan/input')}
                  className="flex items-center gap-1.5 border-2 border-primary text-primary px-3 py-1.5 rounded-DEFAULT font-table-data text-table-data hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                  Input Pengeluaran
                </button>
              </div>
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
                  ? `Menampilkan ${(cashflowPage - 1) * 5 + 1}–${Math.min(cashflowPage * 5, meta.total)} dari ${meta.total} transaksi ${periodLabel.toLowerCase()}`
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

            {/* Unduh Laporan PDF */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 flex-1 flex items-end">
              <div className="relative w-full">
                <button
                  onClick={() => setShowPdfMenu(v => !v)}
                  disabled={pdfLoading}
                  className="w-full bg-surface border-2 border-outline-variant text-on-surface font-table-data text-table-data font-bold py-2 rounded-DEFAULT hover:bg-surface-container-low transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  {pdfLoading ? 'Mengunduh...' : 'Unduh Laporan (PDF)'}
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
                {showPdfMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPdfMenu(false)} />
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-container-lowest border border-outline-variant rounded shadow-lg z-20 overflow-hidden">
                      {PDF_PERIODS.map(p => (
                        <button
                          key={p.key}
                          onClick={() => handleDownloadPDF(p.key)}
                          className="w-full text-left px-4 py-2.5 font-table-data text-table-data hover:bg-surface-container-high transition-colors flex items-center gap-2 border-b border-outline-variant last:border-b-0"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                          Laporan {p.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

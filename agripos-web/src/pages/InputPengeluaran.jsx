import { useLocation } from "wouter";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api';

export default function InputPengeluaran() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newExpense) => {
      return fetchApi('/transactions', {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      setLocation('/laporan');
    },
    onError: (error) => {
      alert(`Gagal menyimpan: ${error.message}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const category = formData.get('expense_category');
    const notes = formData.get('expense_notes');
    
    // Prefix notes with category for simple filtering if needed
    const description = `[${category}] ${notes}`;
    
    const newExpense = {
      transactionType: 'Operasional',
      description: description,
      debit: 0,
      credit: Number(formData.get('expense_amount')),
      items: []
    };
    mutation.mutate(newExpense);
  };

  return (
    <div className="flex-1 overflow-auto p-margin-page">
      {/* Page Header / Context */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => setLocation('/laporan')} className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Input Pengeluaran</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Catat biaya operasional dan pembelian harian.</p>
        </div>
      </div>
      {/* Main Form Card (Level 1 Container) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg max-w-3xl">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {/* Row 1: Date & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {/* Field: Tanggal */}
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1" htmlFor="expense_date">
                Tanggal Pengeluaran <span className="text-error">*</span>
              </label>
              <div className="relative w-full">
                <input className="w-full h-input-height px-3 border border-outline rounded bg-surface-container-lowest text-on-surface font-table-data focus:outline-none focus:border-primary focus:border-2 transition-all" id="expense_date" name="expense_date" required type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            {/* Field: Kategori */}
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1" htmlFor="expense_category">
                Kategori <span className="text-error">*</span>
              </label>
              <div className="relative w-full">
                <select className="w-full h-input-height px-3 appearance-none border border-outline rounded bg-surface-container-lowest text-on-surface font-table-data focus:outline-none focus:border-primary focus:border-2 transition-all pr-10" id="expense_category" name="expense_category" required defaultValue="">
                  <option disabled value="">Pilih Kategori...</option>
                  <option value="Operasional">Operasional (Listrik, Air, dll)</option>
                  <option value="Stok">Pembelian Stok</option>
                  <option value="Konsumsi">Konsumsi Pegawai</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
          </div>
          {/* Row 2: Nominal */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1" htmlFor="expense_amount">
              Nominal (Rp) <span className="text-error">*</span>
            </label>
            <div className="flex w-full md:w-1/2">
              <div className="h-input-height px-4 bg-surface-container-high border border-outline border-r-0 rounded-l flex items-center justify-center shrink-0">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Rp</span>
              </div>
              <input className="w-full h-input-height px-3 border border-outline rounded-r bg-surface-container-lowest text-on-surface font-table-data text-[16px] focus:outline-none focus:border-primary focus:border-2 transition-all" id="expense_amount" min="1" name="expense_amount" placeholder="0" required type="number" />
            </div>
          </div>
          {/* Row 3: Keterangan */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="expense_notes">
              Keterangan / Catatan <span className="text-error">*</span>
            </label>
            <textarea className="w-full p-3 border border-outline rounded bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:border-primary focus:border-2 transition-all resize-none" id="expense_notes" name="expense_notes" placeholder="Detail pengeluaran (Cth: Beli nota kontan 5 buku, sapu lidi)..." rows="4" required></textarea>
          </div>
          {/* Divider */}
          <div className="h-[1px] w-full bg-outline-variant mt-2"></div>
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setLocation('/laporan')} className="h-10 px-6 border border-outline font-table-data text-table-data text-on-surface-variant rounded hover:bg-surface-container-high hover:text-on-surface transition-colors" type="button" disabled={mutation.isPending}>
              Batal
            </button>
            <button className="h-10 px-6 bg-primary font-table-data text-table-data text-on-primary rounded hover:bg-surface-tint flex items-center gap-2 transition-colors disabled:opacity-50" type="submit" disabled={mutation.isPending}>
              <span className="material-symbols-outlined text-[18px]">save</span>
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
      {/* Contextual Tip / Rules (Sturdy functional aesthetic) */}
      <div className="mt-6 max-w-3xl border border-tertiary-fixed-dim bg-surface-container p-4 flex gap-3">
        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
        <div>
          <h4 className="font-table-data text-table-data text-on-surface font-semibold">Panduan Pencatatan</h4>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-[14px]">
            Pastikan nota/struk fisik disimpan untuk keperluan audit. Pengeluaran di atas Rp 500.000 disarankan menggunakan persetujuan Manajer Toko terlebih dahulu.
          </p>
        </div>
      </div>
    </div>
  );
}

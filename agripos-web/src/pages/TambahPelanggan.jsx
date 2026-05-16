import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api';
import { useEffect, useState } from 'react';

export default function TambahPelanggan() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formDataState, setFormDataState] = useState({
    name: '',
    phone: '',
    customerType: '',
    address: ''
  });

  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchApi(`/customers/${id}`),
    enabled: isEdit
  });

  useEffect(() => {
    if (customer) {
      setFormDataState({
        name: customer.name,
        phone: customer.phone ? customer.phone.replace('+62', '') : '',
        customerType: customer.customerType,
        address: customer.address || ''
      });
    }
  }, [customer]);

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (isEdit) {
        return fetchApi(`/customers/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        return fetchApi('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      setLocation('/pelanggan');
    },
    onError: (error) => {
      alert(`Gagal menyimpan: ${error.message}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formDataState.name,
      phone: `+62${formDataState.phone}`,
      customerType: formDataState.customerType,
      address: formDataState.address,
    };
    mutation.mutate(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormDataState(prev => ({ ...prev, [name]: value }));
  };

  if (isEdit && isLoadingCustomer) return <div className="p-8 text-center">Memuat data pelanggan...</div>;

  return (
    <div className="flex-grow overflow-y-auto p-margin-page bg-surface">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div 
          onClick={() => setLocation('/pelanggan')} 
          className="mb-6 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-fit"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span className="font-table-data text-table-data">Kembali ke Database Pelanggan</span>
        </div>
        
        {/* Form Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 shadow-sm">
          <h2 className="font-headline-md text-headline-md text-primary mb-8 border-b border-outline-variant pb-4">
            {isEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
          </h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Nama Lengkap */}
            <div className="flex flex-col gap-1">
              <label className="font-table-data text-table-data text-on-surface font-medium" htmlFor="name">Nama Lengkap</label>
              <input 
                name="name" 
                value={formDataState.name}
                onChange={handleChange}
                className="h-input-height border border-outline-variant rounded px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-body-md bg-surface-container-lowest text-on-surface transition-all" 
                id="name" 
                placeholder="Masukkan nama lengkap pelanggan" 
                type="text" 
                required 
              />
            </div>
            
            {/* WhatsApp */}
            <div className="flex flex-col gap-1">
              <label className="font-table-data text-table-data text-on-surface font-medium" htmlFor="phone">Nomor WhatsApp</label>
              <div className="flex relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-table-data text-table-data">+62</span>
                <input 
                  name="phone" 
                  value={formDataState.phone}
                  onChange={handleChange}
                  className="h-input-height border border-outline-variant rounded pl-12 pr-3 w-full focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-body-md bg-surface-container-lowest text-on-surface transition-all" 
                  id="phone" 
                  placeholder="812 3456 7890" 
                  type="tel" 
                  required 
                />
              </div>
            </div>
            
            {/* Info Box */}
            <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary mt-0.5">info</span>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">Data pelanggan digunakan untuk riwayat transaksi dan pengiriman nota digital.</p>
            </div>
            
            {/* Kategori Pelanggan */}
            <div className="flex flex-col gap-1">
              <label className="font-table-data text-table-data text-on-surface font-medium" htmlFor="customerType">Kategori Pelanggan</label>
              <div className="relative">
                <select 
                  name="customerType" 
                  value={formDataState.customerType}
                  onChange={handleChange}
                  className="w-full h-input-height border border-outline-variant rounded px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-body-md bg-surface-container-lowest text-on-surface appearance-none pr-10 transition-all" 
                  id="customerType" 
                  required
                >
                  <option disabled value="">Pilih Kategori</option>
                  <option value="petani">Petani</option>
                  <option value="pengecer">Pengecer</option>
                  <option value="grosir">Grosir</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>
            
            {/* Alamat */}
            <div className="flex flex-col gap-1">
              <label className="font-table-data text-table-data text-on-surface font-medium" htmlFor="address">Alamat</label>
              <textarea 
                name="address" 
                value={formDataState.address}
                onChange={handleChange}
                className="border border-outline-variant rounded p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-body-md bg-surface-container-lowest text-on-surface resize-none transition-all" 
                id="address" 
                placeholder="Masukkan alamat lengkap pengiriman/domisili" 
                rows="3"
              ></textarea>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-outline-variant mt-8">
              <button 
                onClick={() => setLocation('/pelanggan')}
                className="px-6 h-input-height border-2 border-outline-variant text-on-surface font-table-data text-table-data font-bold rounded hover:bg-surface-container-low transition-colors" 
                type="button"
                disabled={mutation.isPending}
              >
                Batal
              </button>
              <button 
                className="px-6 h-input-height bg-primary text-on-primary font-table-data text-table-data font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 shadow-md" 
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { Link, useRoute } from "wouter";

const NavLink = ({ href, icon, label, isActive }) => {
  return (
    <Link href={href} className={isActive ? "bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center gap-3 p-3 transition-transform hover:opacity-90" : "text-on-surface-variant hover:bg-surface-container-high transition-all flex items-center gap-3 p-3 rounded-lg"}>
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-label-caps text-label-caps">{label}</span>
    </Link>
  );
};

export default function Layout({ children }) {
  const [isKasir] = useRoute("/");
  const [isInventory] = useRoute("/inventory");
  const [isPelanggan] = useRoute("/pelanggan");
  const [isLaporan] = useRoute("/laporan");

  return (
    <>
      <nav className="bg-surface border-r border-outline-variant docked left-0 h-full w-64 flex flex-col gap-unit p-4 shrink-0 z-20">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined">agriculture</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md font-bold text-primary">AgriPOS</div>
            <div className="font-label-caps text-label-caps text-on-surface-variant">Agri Retail Management</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-grow">
          <NavLink href="/" icon="point_of_sale" label="Kasir" isActive={isKasir} />
          <NavLink href="/inventory" icon="inventory_2" label="Inventory" isActive={isInventory} />
          <NavLink href="/pelanggan" icon="groups" label="Pelanggan" isActive={isPelanggan} />
          <NavLink href="/laporan" icon="analytics" label="Laporan" isActive={isLaporan} />
        </div>
        <div className="mt-auto border-t border-outline-variant pt-4 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">person</span>
          </div>
          <div className="flex flex-col">
            <span className="font-table-data text-table-data">Budi (Kasir)</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">Shift Pagi</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-col flex-grow h-full w-full bg-surface-container-lowest">
        <header className="bg-surface-container-lowest border-b border-outline-variant docked full-width top-0 flex justify-between items-center w-full px-margin-page h-input-height shrink-0 z-10 py-4 h-16">
          <div className="flex-1 max-w-xl flex items-center gap-4">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full h-10 pl-10 pr-4 bg-surface-container-low border border-outline-variant rounded-DEFAULT focus:border-primary focus:ring-1 focus:ring-primary font-table-data text-table-data outline-none transition-colors" placeholder="Cari barang (nama/kategori/barcode)..." type="text" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-variant text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">barcode_scanner</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-on-surface-variant font-table-data text-table-data flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              12 Oct 2023
            </div>
            <button className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        <main className="flex-grow flex overflow-hidden">
          {children}
        </main>
      </div>
    </>
  );
}

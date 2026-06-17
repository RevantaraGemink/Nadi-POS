import { Route, Switch } from "wouter";
import Layout from "./components/Layout";
import Kasir from "./pages/Kasir";
import Inventory from "./pages/Inventory";
import Pelanggan from "./pages/Pelanggan";
import Laporan from "./pages/Laporan";
import TambahEditBarang from "./pages/TambahEditBarang";
import RestokBarang from "./pages/RestokBarang";
import PratinjauStruk from "./pages/PratinjauStruk";
import DetailRiwayatPelanggan from "./pages/DetailRiwayatPelanggan";
import InputPengeluaran from "./pages/InputPengeluaran";
import InputPemasukan from "./pages/InputPemasukan";
import TambahPelanggan from "./pages/TambahPelanggan";

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Kasir} />
        <Route path="/kasir/struk/:id" component={PratinjauStruk} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/inventory/tambah" component={TambahEditBarang} />
        <Route path="/inventory/edit/:id" component={TambahEditBarang} />
        <Route path="/inventory/restok" component={RestokBarang} />
        <Route path="/pelanggan" component={Pelanggan} />
        <Route path="/pelanggan/tambah" component={TambahPelanggan} />
        <Route path="/pelanggan/:id/edit" component={TambahPelanggan} />
        <Route path="/pelanggan/:id/detail" component={DetailRiwayatPelanggan} />
        <Route path="/laporan" component={Laporan} />
        <Route path="/laporan/input" component={InputPengeluaran} />
        <Route path="/laporan/input-pemasukan" component={InputPemasukan} />
      </Switch>
    </Layout>
  );
}

export default App;

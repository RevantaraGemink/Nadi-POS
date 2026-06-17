import React from 'react';

/**
 * Komponen Khusus untuk Struk Thermal Printer (58mm & 80mm).
 * Komponen ini hanya akan terlihat saat diprint (dikendalikan oleh CSS @media print).
 * Di layar monitor biasa, komponen ini tersembunyi (hidden).
 */
export default function ReceiptPrinter({ transaction, items, shopName = "Toko Tani Makmur" }) {
  if (!transaction) return null;

  return (
    <div className="receipt-container hidden print:block text-black bg-white">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="font-bold text-xl">{shopName}</h2>
        <p className="text-sm">Toko Pertanian Terpercaya</p>
        <p className="text-sm border-b pb-2 mb-2">Kasir: {transaction.cashier || 'Admin'}</p>
        <p className="text-sm">Tgl: {new Date(transaction.createdAt).toLocaleString('id-ID')}</p>
        <p className="text-sm font-bold border-b pb-2">No: TX-{transaction.id}</p>
      </div>

      {/* Items */}
      <div className="mb-4">
        <table className="w-full text-sm">
          <tbody>
            {items?.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr>
                  <td colSpan="3" className="font-semibold text-left">{item.productName}</td>
                </tr>
                <tr>
                  <td className="text-left w-1/4">{item.quantity} x</td>
                  <td className="text-left w-1/4">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className="text-right font-bold w-1/2">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="border-t border-dashed border-gray-400 pt-2 mb-4">
        <div className="flex justify-between font-bold text-lg">
          <span>TOTAL</span>
          <span>Rp {transaction.debit?.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Tunai</span>
          <span>Rp {(transaction.debit || 0).toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm mt-8 border-t pt-2">
        <p>Terima Kasih!</p>
        <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
      </div>
    </div>
  );
}

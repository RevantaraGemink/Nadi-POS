import { useEffect, useRef } from 'react';

/**
 * Hook untuk menangkap input dari Barcode Scanner.
 * Barcode scanner bekerja seperti keyboard yang mengetik sangat cepat.
 * 
 * @param {function} onScan - Callback saat barcode berhasil terbaca
 */
export function useBarcodeScanner(onScan) {
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Abaikan jika fokus sedang berada pada input text/textarea biasa
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      // Jika tombol 'Enter' ditekan dan ada isi di buffer
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 2) { // Minimal panjang barcode
          onScan(barcodeBuffer.current);
        }
        barcodeBuffer.current = '';
        return;
      }

      // Jika karakter yang diketik valid (huruf/angka/simbol)
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;

        // Reset buffer jika jeda ketikan terlalu lama (bukan scanner)
        // Scanner umumnya sangat cepat (< 50ms per karakter)
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100); 
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
}

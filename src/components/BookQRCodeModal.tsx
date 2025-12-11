import React from 'react';
import { X, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { type Book } from '../lib/supabase';

interface BookQRCodeModalProps {
  book: Book;
  onClose: () => void;
}

const BookQRCodeModal: React.FC<BookQRCodeModalProps> = ({ book, onClose }) => {
  const qrValue = `${window.location.origin}/book/${book.id}`;

  const handlePrint = () => {
    const printContent = document.getElementById('qr-print-area');
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print QR Code</title>');
      printWindow.document.write('<style>body { font-family: sans-serif; text-align: center; display: flex; align-items: center; justify-content: center; height: 100vh; } .container { display: flex; flex-direction: column; align-items: center; justify-content: center; } canvas { max-width: 80%; height: auto; } </style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div class="container">');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</div>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Book QR Code</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 text-center">
          <div id="qr-print-area">
            <h3 className="text-lg font-medium text-neutral-800 mb-2">{book.title}</h3>
            <p className="text-sm text-neutral-500 mb-4">DDC: {book.ddc_number || 'N/A'}</p>
            <div className="flex justify-center">
              <QRCodeCanvas value={qrValue} size={256} includeMargin={true} />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-neutral-100 rounded-md">Close</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2">
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookQRCodeModal;

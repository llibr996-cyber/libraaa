import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';

interface PrintModalProps {
  onClose: () => void;
  onPrint: (selections: Record<string, boolean>) => void;
}

const printSections = {
  books: 'Book Collection',
  members: 'Library Members',
  history: 'Circulation History',
  fines: 'Fines Report',
};

const PrintModal: React.FC<PrintModalProps> = ({ onClose, onPrint }) => {
  const [selections, setSelections] = useState<Record<string, boolean>>({
    books: true,
    members: false,
    history: false,
    fines: false,
  });

  const handleCheckboxChange = (section: string) => {
    setSelections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePrintClick = () => {
    if (Object.values(selections).every(v => !v)) {
      alert('Please select at least one section to print.');
      return;
    }
    onPrint(selections);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Select Sections to Print</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600">Choose which reports you want to include in the printout.</p>
          <div className="space-y-3">
            {Object.entries(printSections).map(([key, title]) => (
              <label key={key} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md cursor-pointer hover:bg-neutral-100">
                <input
                  type="checkbox"
                  checked={!!selections[key]}
                  onChange={() => handleCheckboxChange(key)}
                  className="h-5 w-5 rounded border-neutral-300 text-primary focus:ring-primary-light"
                />
                <span className="font-medium text-neutral-700">{title}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-neutral-100 rounded-md">Cancel</button>
          <button onClick={handlePrintClick} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2">
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;

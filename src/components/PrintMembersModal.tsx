import React, { useState, useMemo } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';
import { type Member } from '../lib/supabase';

interface PrintMembersModalProps {
  onClose: () => void;
  allMembers: Member[];
}

const PrintMembersModal: React.FC<PrintMembersModalProps> = ({ onClose, allMembers }) => {
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);
  const [printableContent, setPrintableContent] = useState('');

  const availableClasses = useMemo(() => {
    const classes = new Set(allMembers.map(m => m.class).filter(Boolean) as string[]);
    return Array.from(classes).sort();
  }, [allMembers]);

  const handleToggleClass = (className: string) => {
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(className)) {
        newSet.delete(className);
      } else {
        newSet.add(className);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedClasses.size === availableClasses.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(availableClasses));
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);

    const membersToPrint = selectedClasses.size > 0
      ? allMembers.filter(m => m.class && selectedClasses.has(m.class))
      : allMembers;

    if (membersToPrint.length === 0) {
      alert('No members to print for the selected classes.');
      setIsPrinting(false);
      return;
    }

    const tableRows = membersToPrint
      .map(member => `
        <tr>
          <td>${member.register_number || 'N/A'}</td>
          <td>${member.name}</td>
          <td>${member.class || 'N/A'}</td>
          <td>${member.phone || 'N/A'}</td>
          <td>${member.place || 'N/A'}</td>
        </tr>
      `).join('');

    const content = `
      <div id="member-print-area">
        <h1>Muhimmath Library - Member List</h1>
        <table>
          <thead>
            <tr>
              <th>Reg. No</th>
              <th>Name</th>
              <th>Class</th>
              <th>Phone</th>
              <th>Place</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
    
    setPrintableContent(content);

    // Allow time for state to update and DOM to render before printing
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      setPrintableContent('');
      onClose();
    }, 500);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">Print Member List</h2>
            <button onClick={onClose}><X /></button>
          </div>
          <div className="p-6 flex-grow overflow-y-auto">
            <p className="text-sm text-neutral-600 mb-4">
              Select classes to print. If no classes are selected, all members will be printed.
            </p>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Filter by Class</h3>
              <button onClick={handleSelectAll} className="text-sm font-medium text-primary">
                {selectedClasses.size === availableClasses.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="border rounded-lg max-h-60 overflow-y-auto p-3 space-y-2 bg-neutral-50">
              {availableClasses.map(className => (
                <label key={className} className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClasses.has(className)}
                    onChange={() => handleToggleClass(className)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary-light"
                  />
                  <span>{className}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="p-6 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-neutral-100 rounded-md">Cancel</button>
            <button onClick={handlePrint} disabled={isPrinting} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 disabled:opacity-50">
              {isPrinting ? <Loader2 className="animate-spin" /> : <Printer size={18} />}
              Print List
            </button>
          </div>
        </div>
      </div>
      {/* Hidden div for printing */}
      {isPrinting && <div dangerouslySetInnerHTML={{ __html: printableContent }} />}
    </>
  );
};

export default PrintMembersModal;

import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Type, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase, type Book } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';
import { useDebounce } from '../hooks/useDebounce';

interface ScanQRModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ScanMode = 'scan' | 'manual';
type ActionType = 'issue' | 'return';

const ScanQRModal: React.FC<ScanQRModalProps> = ({ onClose, onSuccess }) => {
  const [scanMode, setScanMode] = useState<ScanMode>('scan');
  const [actionType, setActionType] = useState<ActionType>('issue');
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [manualIdentifier, setManualIdentifier] = useState('');
  const debouncedManualIdentifier = useDebounce(manualIdentifier, 500);
  const [message, setMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = "qr-scanner-region";
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (scanMode === 'scan') {
        scannerRef.current = new Html5Qrcode(scannerRegionId, false);
    }
    
    return () => {
      isMounted.current = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
          console.warn("Scanner stop on unmount failed:", err);
        });
      }
    };
  }, [scanMode]);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || scanMode !== 'scan') return;

    const start = async () => {
      if (scanner.isScanning) return;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScanSuccess,
          handleScanError
        );
      } catch (err) {
        if (isMounted.current) {
          setMessage({ type: 'error', text: 'Could not start QR scanner. Check camera permissions.' });
        }
      }
    };

    const stop = async () => {
      if (scanner.isScanning) {
        try {
          await scanner.stop();
        } catch (err) {
          console.warn("Scanner stop failed, may already be stopping.", err);
        }
      }
    };

    if (!scannedBook) {
      start();
    } else {
      stop();
    }

  }, [scanMode, scannedBook]);

  const processScannedText = async (text: string) => {
    let book: Book | null = null;
    let error: any = null;
    const urlPrefix = `${window.location.origin}/book/`;

    if (text.startsWith(urlPrefix)) {
        const bookId = text.substring(urlPrefix.length);
        if (bookId) {
            const { data, error: queryError } = await supabase.from('books').select('*').eq('id', bookId).single();
            book = data;
            error = queryError;
        }
    } else {
        // Try to find by DDC or ID (fallback for old QR codes)
        const { data, error: queryError } = await supabase
            .from('books')
            .select('*')
            .or(`ddc_number.eq.${text},id.eq.${text}`)
            .limit(1);

        if (data && data.length > 0) {
            book = data[0];
        }
        error = queryError;
    }

    if (!isMounted.current) return;

    if (error || !book) {
        setMessage({ type: 'error', text: 'Book not found. Please try again.' });
        setScannedBook(null);
        setTimeout(() => {
            if (isMounted.current) setMessage(null);
        }, 3000);
    } else {
        setScannedBook(book);
        setMessage({ type: 'info', text: `Book found: ${book.title}` });
    }
  };

  useEffect(() => {
    if (debouncedManualIdentifier && scanMode === 'manual' && !scannedBook) {
        setLoading(true);
        setMessage({ type: 'info', text: 'Searching for book...' });
        processScannedText(debouncedManualIdentifier).finally(() => {
            if (isMounted.current) setLoading(false);
        });
    }
  }, [debouncedManualIdentifier, scanMode]);

  const handleScanSuccess = (decodedText: string) => {
    if (loading) return;
    setLoading(true);
    setMessage({ type: 'info', text: 'QR code detected. Verifying book...' });
    
    processScannedText(decodedText).finally(() => {
        if (isMounted.current) setLoading(false);
    });
  };

  const handleScanError = (errorMessage: string) => {
    // This callback is often noisy, so we'll keep it quiet.
  };

  const handleFinalAction = async () => {
    if (!scannedBook) return;
    setLoading(true);
    setMessage(null);

    if (actionType === 'issue') {
      if (!selectedMember) {
        setMessage({ type: 'error', text: 'Please select a member to issue the book.' });
        setLoading(false);
        return;
      }
      const { error } = await supabase.rpc('issue_book', {
        p_book_id: scannedBook.id,
        p_member_id: selectedMember.value,
        p_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `Successfully issued "${scannedBook.title}" to ${selectedMember.label}.` });
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      }
    } else { // Return
      const { error } = await supabase.rpc('return_book_by_id', { p_book_id: scannedBook.id });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `Successfully returned "${scannedBook.title}".` });
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      }
    }
    setLoading(false);
  };

  const resetState = () => {
    setScannedBook(null);
    setSelectedMember(null);
    setManualIdentifier('');
    setMessage(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Scan Book</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="p-6">
          {!scannedBook ? (
            <>
              <div className="flex items-center justify-center gap-2 bg-neutral-100 rounded-lg p-1 mb-4">
                <button onClick={() => setScanMode('scan')} className={`w-full py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 ${scanMode === 'scan' ? 'bg-white shadow' : ''}`}><QrCode size={16} /> Scan</button>
                <button onClick={() => setScanMode('manual')} className={`w-full py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 ${scanMode === 'manual' ? 'bg-white shadow' : ''}`}><Type size={16} /> Manual</button>
              </div>
              {scanMode === 'scan' ? (
                <div id={scannerRegionId} className="w-full h-64 border rounded-lg bg-neutral-900"></div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Enter Book DDC or ID (auto-searches)</label>
                    <input
                      type="text"
                      value={manualIdentifier}
                      onChange={e => setManualIdentifier(e.target.value)}
                      placeholder="e.g., 813.6 or book ID"
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={loading}
                    />
                  </div>
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-neutral-300"></div>
                    <span className="flex-shrink mx-4 text-neutral-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-neutral-300"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Search and Select Book</label>
                    <SearchableSelect
                      value={null}
                      onChange={(option: any) => {
                        if (option) {
                          setManualIdentifier('');
                          setScannedBook(option.data);
                          setMessage({ type: 'info', text: `Book found: ${option.label}` });
                        }
                      }}
                      placeholder="Type to search by title, author, DDC..."
                      tableName="books"
                      labelField="title"
                      searchFields={['title', 'author', 'ddc_number']}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <h3 className="font-bold text-green-800">{scannedBook.title}</h3>
                <p className="text-sm text-green-700">by {scannedBook.author}</p>
              </div>
              <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                <button onClick={() => setActionType('issue')} className={`w-full py-2 rounded-md font-medium text-sm ${actionType === 'issue' ? 'bg-white shadow' : ''}`}>Issue Book</button>
                <button onClick={() => setActionType('return')} className={`w-full py-2 rounded-md font-medium text-sm ${actionType === 'return' ? 'bg-white shadow' : ''}`}>Return Book</button>
              </div>
              {actionType === 'issue' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Select Member *</label>
                  <SearchableSelect value={selectedMember} onChange={setSelectedMember} placeholder="Search for a member..." tableName="members" labelField="name" searchFields={['name', 'email', 'register_number']} required />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetState} className="px-4 py-2 bg-neutral-100 rounded-md">Scan Another</button>
                <button onClick={handleFinalAction} disabled={loading} className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50 flex items-center justify-center">
                  {loading ? <Loader2 className="animate-spin" /> : (actionType === 'issue' ? 'Issue Book' : 'Confirm Return')}
                </button>
              </div>
            </div>
          )}
          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm flex items-center gap-2 ${
              message.type === 'error' ? 'bg-red-100 text-red-800' :
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {message.type === 'error' && <AlertTriangle size={16}/>}
              {message.type === 'success' && <CheckCircle size={16}/>}
              {loading && message.type === 'info' && <Loader2 className="animate-spin" size={16} />}
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanQRModal;

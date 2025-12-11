import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const icons = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
};

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      layout
      className="fixed top-5 right-5 z-[100] w-full max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5"
    >
      <div className="w-full rounded-lg p-4 flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onClose} className="inline-flex text-neutral-400 hover:text-neutral-500">
            <X size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Notification;

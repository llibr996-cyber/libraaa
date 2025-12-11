import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Notification from '../components/Notification';
import { AnimatePresence } from 'framer-motion';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  addNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Date.now();
    setNotifications(currentNotifications => [...currentNotifications, { id, message, type }]);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(currentNotifications =>
      currentNotifications.filter(n => n.id !== id)
    );
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] space-y-2">
        <AnimatePresence>
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

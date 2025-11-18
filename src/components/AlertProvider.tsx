import React, { useState, useEffect, ReactNode } from 'react';
import { AlertModal, AlertButton } from './AlertModal';
import { setAlertListener } from '../utils/alert';

interface AlertProviderProps {
  children: ReactNode;
}

interface AlertState {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AlertButton[];
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    message: '',
    buttons: [{ text: 'OK', style: 'default' }],
  });

  useEffect(() => {
    setAlertListener((state) => {
      setAlertState(state);
    });
  }, []);

  const handleClose = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  return (
    <>
      {children}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onRequestClose={handleClose}
      />
    </>
  );
};

import { createContext, useContext } from 'react';

export const StoreContext = createContext(null);

export const useStore = () => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error('useStore must be used inside a StoreProvider');
  }

  return context;
};

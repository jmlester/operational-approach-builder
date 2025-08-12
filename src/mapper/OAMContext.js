import { createContext, useContext } from 'react';

export const OAMContext = createContext(null);

export function useOAM() {
  const ctx = useContext(OAMContext);
  if (!ctx) {
    throw new Error('useOAM must be used inside an <OAMContext.Provider>');
  }
  return ctx;
}

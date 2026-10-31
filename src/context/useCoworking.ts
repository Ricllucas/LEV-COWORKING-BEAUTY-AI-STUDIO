import { useContext } from 'react';
import { CoworkingContext, CoworkingContextType } from './CoworkingContext';

/**
 * Custom hook to use Coworking context
 * Must be called within CoworkingProvider
 */
export const useCoworking = (): CoworkingContextType => {
  const context = useContext(CoworkingContext);

  if (!context) {
    throw new Error('useCoworking must be used within a CoworkingProvider');
  }

  return context;
};

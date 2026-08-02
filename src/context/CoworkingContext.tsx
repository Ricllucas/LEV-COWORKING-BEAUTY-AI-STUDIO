import React, { createContext, useReducer, ReactNode, useCallback } from 'react';
import {
  User,
  Professional,
  Service,
  Client,
  Appointment,
  CoworkingSettings,
  Review,
  WaitlistEntry,
  SystemNotification,
} from '../types';
import { StorageService } from '../services/storage';

// State shape
export interface CoworkingState {
  currentUser: User;
  settings: CoworkingSettings;
  professionals: Professional[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  reviews: Review[];
  waitlist: WaitlistEntry[];
  notifications: SystemNotification[];
}

// Action types
export type CoworkingAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_SETTINGS'; payload: CoworkingSettings }
  | { type: 'SET_PROFESSIONALS'; payload: Professional[] }
  | { type: 'SET_SERVICES'; payload: Service[] }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'SET_REVIEWS'; payload: Review[] }
  | { type: 'SET_WAITLIST'; payload: WaitlistEntry[] }
  | { type: 'SET_NOTIFICATIONS'; payload: SystemNotification[] }
  | { type: 'UPDATE_PROFESSIONAL'; payload: Professional }
  | { type: 'UPDATE_SERVICE'; payload: Service }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'DELETE_APPOINTMENT'; payload: string }
  | { type: 'SYNC_ALL'; payload: Partial<CoworkingState> };

// Reducer function
export const coworkingReducer = (state: CoworkingState, action: CoworkingAction): CoworkingState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'SET_PROFESSIONALS':
      return { ...state, professionals: action.payload };

    case 'SET_SERVICES':
      return { ...state, services: action.payload };

    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };

    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload };

    case 'SET_REVIEWS':
      return { ...state, reviews: action.payload };

    case 'SET_WAITLIST':
      return { ...state, waitlist: action.payload };

    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };

    case 'UPDATE_PROFESSIONAL':
      return {
        ...state,
        professionals: state.professionals.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map(s =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(a =>
          a.id === action.payload.id ? action.payload : a
        ),
      };

    case 'ADD_APPOINTMENT':
      return {
        ...state,
        appointments: [...state.appointments, action.payload],
      };

    case 'DELETE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.filter(a => a.id !== action.payload),
      };

    case 'SYNC_ALL':
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

// Initial state
export const getInitialState = (): CoworkingState => ({
  currentUser: StorageService.getCurrentUser(),
  settings: StorageService.getSettings(),
  professionals: StorageService.getProfessionals(),
  services: StorageService.getServices(),
  clients: StorageService.getClients(),
  appointments: StorageService.getAppointments(),
  reviews: StorageService.getReviews(),
  waitlist: StorageService.getWaitlist(),
  notifications: StorageService.getNotifications(),
});

// Context type
export interface CoworkingContextType {
  state: CoworkingState;
  dispatch: React.Dispatch<CoworkingAction>;
}

// Create context
export const CoworkingContext = createContext<CoworkingContextType | undefined>(undefined);

// Provider props
interface CoworkingProviderProps {
  children: ReactNode;
}

// Provider component
export const CoworkingProvider: React.FC<CoworkingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(coworkingReducer, undefined, getInitialState);

  // Sync state with localStorage whenever it changes
  React.useEffect(() => {
    StorageService.setCurrentUser(state.currentUser);
  }, [state.currentUser]);

  React.useEffect(() => {
    state.professionals.forEach(p => StorageService.saveProfessional(p));
  }, [state.professionals]);

  React.useEffect(() => {
    state.services.forEach(s => StorageService.saveService(s));
  }, [state.services]);

  React.useEffect(() => {
    state.clients.forEach(c => StorageService.saveClient(c));
  }, [state.clients]);

  React.useEffect(() => {
    state.appointments.forEach(a => StorageService.saveAppointment(a));
  }, [state.appointments]);

  const value: CoworkingContextType = { state, dispatch };

  return (
    <CoworkingContext.Provider value={value}>
      {children}
    </CoworkingContext.Provider>
  );
};

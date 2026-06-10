import React, { createContext, useState, ReactNode } from 'react';
import { Booking, MOCK_BOOKINGS } from '@/services/mockData';

interface BookingDraft {
  origin: string;
  destination: string;
  isAirport: boolean;
  terminal: string;
  seats: number;
  luggage: number;
  vehicleCategory: string;
  paymentMethod: 'efectivo' | 'tarjeta';
  priceClosed: number;
  scheduledFor: string;
}

const DEFAULT_DRAFT: BookingDraft = {
  origin: '',
  destination: '',
  isAirport: false,
  terminal: 'T4',
  seats: 1,
  luggage: 1,
  vehicleCategory: 'estandar',
  paymentMethod: 'tarjeta',
  priceClosed: 0,
  scheduledFor: '',
};

interface BookingContextType {
  bookings: Booking[];
  draft: BookingDraft;
  updateDraft: (updates: Partial<BookingDraft>) => void;
  resetDraft: () => void;
  confirmBooking: () => string;
  getBooking: (id: string) => Booking | undefined;
  activeBooking: Booking | null;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [draft, setDraft] = useState<BookingDraft>(DEFAULT_DRAFT);

  const updateDraft = (updates: Partial<BookingDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };

  const resetDraft = () => {
    setDraft(DEFAULT_DRAFT);
  };

  const confirmBooking = (): string => {
    const id = `TRX-2026-${String(bookings.length + 1).padStart(3, '0')}`;
    const newBooking: Booking = {
      id,
      origin: draft.origin || 'Las Rozas, Calle Mayor 12',
      destination: draft.destination || 'Madrid Barajas T4',
      isAirport: draft.isAirport,
      terminal: draft.terminal,
      scheduledFor: draft.scheduledFor || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      state: 'confirmada',
      priceClosed: draft.priceClosed || 45,
      vehicleCategory: draft.vehicleCategory,
      seats: draft.seats,
      luggage: draft.luggage,
      paymentMethod: draft.paymentMethod,
      driverName: 'David',
      driverRating: '4.9',
      driverPhone: '+34 600 000 000',
      vehiclePlate: '1234 ABC',
      vehicleModel: 'Seat León',
      createdAt: new Date().toISOString(),
      confirmations: [
        { hito: 'al_reservar', label: 'Al reservar', confirmedAt: new Date().toISOString(), status: 'done' },
        { hito: 'dia_antes', label: 'Día anterior', status: 'pending' },
        { hito: 'una_hora', label: '1 hora antes', status: 'upcoming' },
        { hito: 'treinta_min', label: '30 minutos', status: 'upcoming' },
        { hito: 'quince_min', label: 'En camino', status: 'upcoming' },
      ],
    };
    setBookings(prev => [newBooking, ...prev]);
    resetDraft();
    return id;
  };

  const getBooking = (id: string) => bookings.find(b => b.id === id);

  const activeBooking = bookings.find(b =>
    !['finalizada', 'cerrada', 'cancelada'].includes(b.state)
  ) || null;

  return (
    <BookingContext.Provider value={{
      bookings,
      draft,
      updateDraft,
      resetDraft,
      confirmBooking,
      getBooking,
      activeBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

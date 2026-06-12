import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Booking } from '@/services/mockData';

const STORAGE_KEY = 'onspace_bookings';

function loadBookings(): Booking[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    }
  } catch {}
}

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
  confirmBooking: () => Promise<string>;
  getBooking: (id: string) => Booking | undefined;
  updateBookingState: (id: string, state: string) => void;
  activeBooking: Booking | null;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(loadBookings);
  const [draft, setDraft] = useState<BookingDraft>(DEFAULT_DRAFT);

  useEffect(() => {
    saveBookings(bookings);
  }, [bookings]);

  const updateDraft = (updates: Partial<BookingDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };

  const resetDraft = () => {
    setDraft(DEFAULT_DRAFT);
  };

  const confirmBooking = async (): Promise<string> => {
    const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://madridtaxis.es';
    const scheduledDate = draft.scheduledFor
      ? new Date(draft.scheduledFor)
      : new Date(Date.now() + 2 * 60 * 60 * 1000);

    const res = await fetch(`${API_BASE}/api/reservar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origen: draft.origin,
        destino: draft.destination,
        fecha_viaje: scheduledDate.toISOString().slice(0, 10),
        hora_viaje: scheduledDate.toTimeString().slice(0, 8),
        pasajeros: draft.seats,
        precio_estimado: draft.priceClosed,
        tipo_precio: 'fijo',
        tipo_servicio: 'programado',
        telefono: '600000000',
        origen_canal: 'app',
        notas: `Maletas: ${draft.luggage} | Vehículo: ${draft.vehicleCategory} | Pago: ${draft.paymentMethod}`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error ?? 'Error al crear la reserva');
    }

    const data = await res.json();
    const id: string = data.reserva_id ?? data.id_reserva;

    const newBooking: Booking = {
      id,
      origin: draft.origin,
      destination: draft.destination,
      isAirport: draft.isAirport,
      terminal: draft.terminal,
      scheduledFor: scheduledDate.toISOString(),
      state: 'confirmada',
      priceClosed: draft.priceClosed,
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

  const updateBookingState = (id: string, state: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, state: state as any } : b));
  };

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
      updateBookingState,
      activeBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

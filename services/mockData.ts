import { BOOKING_STATES } from '@/constants/config';

export type BookingState = keyof typeof BOOKING_STATES;

export interface Booking {
  id: string;
  origin: string;
  destination: string;
  isAirport: boolean;
  terminal?: string;
  scheduledFor: string;
  state: BookingState;
  priceClosed: number;
  vehicleCategory: string;
  seats: number;
  luggage: number;
  paymentMethod: 'efectivo' | 'tarjeta';
  driverName: string;
  driverRating: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleModel: string;
  createdAt: string;
  confirmations: Array<{
    hito: string;
    label: string;
    confirmedAt?: string;
    status: 'done' | 'pending' | 'upcoming';
  }>;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  totalTrips: number;
  isAvailable: boolean;
  currentState: 'libre' | 'ocupado' | 'fuera_servicio';
  modoDia: 'circuito_largo' | 'cortos_suaves';
  todayEarnings: number;
  todayTrips: number;
  vehicle: {
    model: string;
    plate: string;
    category: string;
    kmActual: number;
  };
}

export interface IncomingService {
  id: string;
  origin: string;
  destination: string;
  isAirport: boolean;
  scheduledFor: string;
  estimatedKm: number;
  estimatedMinutes: number;
  price: number;
  clientCategory: 'nuevo' | 'recurrente' | 'vip';
  clientName: string;
  clientTrips: number;
  urgency: 'normal' | 'urgente' | 'vip';
  assignmentScore: number;
  timeToClient: number; // minutes
  expiresIn: number; // seconds
}

// Mock bookings
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'TRX-2026-001',
    origin: 'Las Rozas, Calle Mayor 12',
    destination: 'Madrid Barajas T4',
    isAirport: true,
    terminal: 'T4',
    scheduledFor: '2026-06-12T05:30:00',
    state: 'conductor_confirmado',
    priceClosed: 45,
    vehicleCategory: 'estandar',
    seats: 2,
    luggage: 2,
    paymentMethod: 'tarjeta',
    driverName: 'David',
    driverRating: '4.9',
    driverPhone: '+34 600 000 000',
    vehiclePlate: '1234 ABC',
    vehicleModel: 'Seat León',
    createdAt: '2026-06-10T10:00:00',
    confirmations: [
      { hito: 'al_reservar', label: 'Al reservar', confirmedAt: '2026-06-10T10:00:00', status: 'done' },
      { hito: 'dia_antes', label: 'Día anterior', confirmedAt: '2026-06-11T18:00:00', status: 'done' },
      { hito: 'una_hora', label: '1 hora antes', status: 'pending' },
      { hito: 'treinta_min', label: '30 minutos', status: 'upcoming' },
      { hito: 'quince_min', label: 'En camino', status: 'upcoming' },
    ],
  },
  {
    id: 'TRX-2026-002',
    origin: 'Madrid Barajas T1',
    destination: 'Pozuelo de Alarcón',
    isAirport: true,
    terminal: 'T1',
    scheduledFor: '2026-06-08T14:20:00',
    state: 'finalizada',
    priceClosed: 50,
    vehicleCategory: 'estandar',
    seats: 1,
    luggage: 1,
    paymentMethod: 'efectivo',
    driverName: 'David',
    driverRating: '4.9',
    driverPhone: '+34 600 000 000',
    vehiclePlate: '1234 ABC',
    vehicleModel: 'Seat León',
    createdAt: '2026-06-07T20:00:00',
    confirmations: [
      { hito: 'al_reservar', label: 'Al reservar', confirmedAt: '2026-06-07T20:00:00', status: 'done' },
      { hito: 'dia_antes', label: 'Día anterior', confirmedAt: '2026-06-07T18:00:00', status: 'done' },
      { hito: 'una_hora', label: '1 hora antes', confirmedAt: '2026-06-08T13:20:00', status: 'done' },
    ],
  },
];

// Mock driver data
export const MOCK_DRIVER: Driver = {
  id: 'drv-david',
  name: 'David',
  rating: 4.9,
  totalTrips: 847,
  isAvailable: true,
  currentState: 'libre',
  modoDia: 'circuito_largo',
  todayEarnings: 285,
  todayTrips: 6,
  vehicle: {
    model: 'Seat León',
    plate: '1234 ABC',
    category: 'estandar',
    kmActual: 87450,
  },
};

// Mock incoming service
export const MOCK_INCOMING_SERVICE: IncomingService = {
  id: 'SVC-2026-042',
  origin: 'Majadahonda, Av. de España 45',
  destination: 'Madrid Barajas T4',
  isAirport: true,
  scheduledFor: 'Ahora',
  estimatedKm: 32,
  estimatedMinutes: 38,
  price: 48,
  clientCategory: 'vip',
  clientName: 'María G.',
  clientTrips: 14,
  urgency: 'normal',
  assignmentScore: 91.2,
  timeToClient: 7,
  expiresIn: 25,
};

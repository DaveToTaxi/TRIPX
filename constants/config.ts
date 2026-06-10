export const APP_CONFIG = {
  name: 'TRIPX',
  tagline: 'Tu taxi, tu tranquilidad',
  phone: '+34 600 000 000',
  whatsapp: '+34 600 000 000',
  brandName: 'MadridTaxis',
  driverName: 'David',
  driverRating: '4.9',
  driverTrips: '847',
};

export const BOOKING_STATES = {
  solicitada: { label: 'Reserva solicitada', icon: 'radio-button-unchecked', step: 0 },
  confirmada: { label: 'Confirmada', icon: 'check-circle', step: 1 },
  conductor_asignado: { label: 'Conductor asignado', icon: 'person', step: 2 },
  conductor_confirmado: { label: 'Conductor confirmado', icon: 'verified', step: 3 },
  en_camino: { label: 'En camino', icon: 'directions-car', step: 4 },
  llegando: { label: 'Llegando (≈ 2 min)', icon: 'near-me', step: 5 },
  cliente_a_bordo: { label: 'A bordo', icon: 'airline-seat-recline-normal', step: 6 },
  en_ruta: { label: 'En ruta', icon: 'flight-takeoff', step: 7 },
  finalizada: { label: 'Finalizado', icon: 'flag', step: 8 },
} as const;

export const VEHICLE_CATEGORIES = [
  { id: 'estandar', label: 'Estándar', desc: 'Hasta 4 plazas', icon: 'directions-car', extra: '' },
  { id: 'grande', label: 'Grande', desc: 'Hasta 7 plazas', icon: 'airport-shuttle', extra: '+15€' },
  { id: 'premium', label: 'Premium', desc: 'Lujo garantizado', icon: 'star', extra: '+25€' },
  { id: 'electrico', label: 'Eléctrico', desc: 'Tesla · 0 emisiones', icon: 'electric-car', extra: '+20€' },
];

export const AIRPORTS = [
  { id: 'T1', label: 'Barajas T1', city: 'Madrid' },
  { id: 'T2', label: 'Barajas T2', city: 'Madrid' },
  { id: 'T4', label: 'Barajas T4', city: 'Madrid' },
  { id: 'T4S', label: 'Barajas T4S', city: 'Madrid' },
];

export const POPULAR_ROUTES = [
  { origin: 'Las Rozas', destination: 'Madrid T4 Barajas', price: 45, minutes: 35 },
  { origin: 'Pozuelo de Alarcón', destination: 'Madrid T4 Barajas', price: 50, minutes: 40 },
  { origin: 'Majadahonda', destination: 'Madrid T4 Barajas', price: 48, minutes: 38 },
  { origin: 'Madrid Centro', destination: 'Madrid T4 Barajas', price: 35, minutes: 25 },
];

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { MOCK_DRIVER } from '@/services/mockData';
import { useAlert } from '@/template';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

const MOTIVATIONAL_MSGS = {
  low: 'Día tranquilo — el aeropuerto mueve a las 17h. Posiciónate en T4.',
  medium: 'Buen ritmo. Un circuito más y superas el objetivo del día.',
  high: 'Día redondo. Sigue así — estás en el top de la semana.',
};

function getMotivation(trips: number, earnings: number): string {
  if (trips < 3) return MOTIVATIONAL_MSGS.low;
  if (earnings < 200) return MOTIVATIONAL_MSGS.medium;
  return MOTIVATIONAL_MSGS.high;
}

export default function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { conductor } = useAuth();
  const driver = { ...MOCK_DRIVER, name: conductor?.nombre ?? MOCK_DRIVER.name };
  const conductorId = conductor?.id ?? '';
  const sessionToken = conductor?.session_token ?? '';

  const [modoDia, setModoDia] = useState<'circuito_largo' | 'cortos_suaves'>(driver.modoDia);
  const [available, setAvailable] = useState(driver.isAvailable);
  const [incoming, setIncoming] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [rechazadas, setRechazadas] = useState<any[]>([]);
  const [mostrarRechazadas, setMostrarRechazadas] = useState(false);
  const pendingReservaId = useRef<string | null>(null);

  // Supabase — carga pendientes existentes + escucha nuevas en tiempo real
  useEffect(() => {
    if (!available || !conductorId) return;

    const rowToIncoming = (row: any) => ({
      id: row.reserva_id,
      origin: row.origen,
      destination: row.destino,
      isAirport: /(barajas|t1|t2|t4)/i.test(row.destino ?? ''),
      price: row.precio_estimado ?? 0,
      clientName: row.nombre_cliente || 'Cliente',
      clientTrips: 0,
      clientCategory: 'normal',
      estimatedKm: 0,
      estimatedMinutes: 0,
      timeToClient: 0,
      assignmentScore: 0,
      urgency: 'normal',
      scheduledFor: row.hora_viaje ?? 'Ahora',
      expiresIn: 30,
    });

    // Pendientes que yo NO rechacé
    supabase
      .from('reservas')
      .select('*')
      .eq('estado', 'pendiente')
      .is('conductor_id', null)
      .not('rechazado_por', 'cs', `{${conductorId}}`)
      .order('created_at', { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0 && !pendingReservaId.current) {
          pendingReservaId.current = data[0].reserva_id;
          setIncoming(rowToIncoming(data[0]));
          setCountdown(30);
        }
      });

    // Pendientes que yo rechacé — para poder recuperarlas
    supabase
      .from('reservas')
      .select('*')
      .eq('estado', 'pendiente')
      .is('conductor_id', null)
      .contains('rechazado_por', [conductorId])
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setRechazadas(data.map(rowToIncoming));
      });

    const channel = supabase
      .channel('driver-home-reservas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservas' }, (payload) => {
        const row = payload.new as any;
        if (row.estado === 'pendiente' && !pendingReservaId.current) {
          const rechazadaPor: string[] = row.rechazado_por ?? [];
          if (!rechazadaPor.includes(conductorId)) {
            pendingReservaId.current = row.reserva_id;
            setIncoming(rowToIncoming(row));
            setCountdown(30);
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservas' }, (payload) => {
        const row = payload.new as any;
        // Si una reserva rechazada ya no está pendiente, sacarla de la lista
        if (row.estado !== 'pendiente') {
          setRechazadas(prev => prev.filter(r => r.id !== row.reserva_id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [available, conductorId]);

  // Countdown cuando hay reserva entrante
  useEffect(() => {
    if (!incoming) return;
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(t);
          setIncoming(null);
          pendingReservaId.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [incoming]);

  const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://madridtaxis.es';

  const handleAccept = () => {
    if (!incoming) return;
    const reservaId = pendingReservaId.current;
    const snapshot = { ...incoming };
    setIncoming(null);
    pendingReservaId.current = null;
    fetch(`${API_BASE}/api/reservas/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reserva_id: reservaId, conductor_id: conductorId, action: 'accept', session_token: sessionToken }),
    }).then(r => r.json()).then(d => {
      if (d.ok) {
        setActiveRide({ ...snapshot, reservaId, estado: 'confirmada' });
      } else {
        console.error('[DriverHome] accept error:', d.error, d.message);
        showAlert('Error', d.message ?? d.error ?? 'No se pudo aceptar');
      }
    }).catch(e => {
      console.error('[DriverHome] accept fetch:', e);
      showAlert('Error de conexión', 'No se pudo contactar con el servidor');
    });
  };

  const handleReject = () => {
    if (!incoming) return;
    const reservaId = pendingReservaId.current;
    const snapshot = { ...incoming };
    setIncoming(null);
    pendingReservaId.current = null;
    setRechazadas(prev => prev.some(r => r.id === snapshot.id) ? prev : [snapshot, ...prev]);
    fetch(`${API_BASE}/api/reservas/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reserva_id: reservaId, conductor_id: conductorId, action: 'reject', session_token: sessionToken }),
    }).catch(e => console.error('[DriverHome] reject fetch:', e));
  };

  const handleRecover = (reserva: any) => {
    if (pendingReservaId.current) return;
    setRechazadas(prev => prev.filter(r => r.id !== reserva.id));
    pendingReservaId.current = reserva.id;
    setIncoming(reserva);
    setCountdown(30);
  };

  const motivation = getMotivation(driver.todayTrips, driver.todayEarnings);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {driver.name}</Text>
            <Text style={styles.subGreeting}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <Pressable
            style={[styles.availBadge, available ? styles.availBadgeOn : styles.availBadgeOff]}
            onPress={() => setAvailable(a => !a)}
          >
            <View style={[styles.availDot, available ? styles.availDotOn : styles.availDotOff]} />
            <Text style={[styles.availText, available ? styles.availTextOn : styles.availTextOff]}>
              {available ? 'Disponible' : 'No disponible'}
            </Text>
          </Pressable>
        </View>

        {/* Earnings card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsMain}>
            <Text style={styles.earningsLabel}>Ganado hoy</Text>
            <Text style={styles.earningsAmount}>{driver.todayEarnings}€</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsStat}>
            <Text style={styles.statValue}>{driver.todayTrips}</Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>
          <View style={styles.earningsStat}>
            <Text style={styles.statValue}>{driver.rating}</Text>
            <Text style={styles.statLabel}>Valoración</Text>
          </View>
          <View style={styles.earningsStat}>
            <Text style={styles.statValue}>{driver.vehicle.kmActual.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Km totales</Text>
          </View>
        </View>

        {/* Motivational message */}
        <View style={styles.motivationCard}>
          <MaterialIcons name="lightbulb" size={18} color={Colors.warning} />
          <Text style={styles.motivationText}>{motivation}</Text>
        </View>

        {/* Modo del día */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo del día</Text>
          <View style={styles.modoRow}>
            <Pressable
              style={[styles.modoBtn, modoDia === 'circuito_largo' && styles.modoBtnActive]}
              onPress={() => setModoDia('circuito_largo')}
            >
              <MaterialIcons
                name="flight-takeoff"
                size={20}
                color={modoDia === 'circuito_largo' ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.modoTitle, modoDia === 'circuito_largo' && styles.modoTitleActive]}>
                Circuito largo
              </Text>
              <Text style={styles.modoDesc}>Aeropuerto ↔ Zona</Text>
            </Pressable>
            <Pressable
              style={[styles.modoBtn, modoDia === 'cortos_suaves' && styles.modoBtnActive]}
              onPress={() => setModoDia('cortos_suaves')}
            >
              <MaterialIcons
                name="local-taxi"
                size={20}
                color={modoDia === 'cortos_suaves' ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.modoTitle, modoDia === 'cortos_suaves' && styles.modoTitleActive]}>
                Cortos suaves
              </Text>
              <Text style={styles.modoDesc}>Zona local · Tranquilo</Text>
            </Pressable>
          </View>
        </View>

        {/* Incoming service */}
        {incoming && available && (
          <View style={[styles.incomingCard, Shadows.gold]}>
            <View style={styles.incomingTop}>
              <View style={styles.incomingBadgeRow}>
                <View style={styles.airportBadge}>
                  <MaterialIcons name="flight-takeoff" size={12} color={Colors.textInverse} />
                  <Text style={styles.airportBadgeText}>AEROPUERTO</Text>
                </View>
                {incoming.clientCategory === 'vip' && (
                  <View style={styles.vipBadge}>
                    <MaterialIcons name="star" size={12} color={Colors.warning} />
                    <Text style={styles.vipBadgeText}>VIP · {incoming.clientTrips} viajes</Text>
                  </View>
                )}
              </View>
              <View style={styles.countdownWrap}>
                <Text style={[styles.countdown, countdown <= 10 && styles.countdownUrgent]}>
                  {countdown}s
                </Text>
              </View>
            </View>

            <View style={styles.incomingRoute}>
              <View style={styles.incomingRoutePoint}>
                <View style={styles.incomingDot} />
                <Text style={styles.incomingOrigin} numberOfLines={1}>{incoming.origin}</Text>
              </View>
              <View style={styles.incomingLine} />
              <View style={styles.incomingRoutePoint}>
                <MaterialIcons name="flight-takeoff" size={14} color={Colors.primary} />
                <Text style={styles.incomingDest} numberOfLines={1}>{incoming.destination}</Text>
              </View>
            </View>

            <View style={styles.incomingMeta}>
              <View style={styles.incomingMetaItem}>
                <MaterialIcons name="near-me" size={13} color={Colors.textMuted} />
                <Text style={styles.incomingMetaText}>{incoming.timeToClient} min a recogida</Text>
              </View>
              <View style={styles.incomingMetaItem}>
                <MaterialIcons name="route" size={13} color={Colors.textMuted} />
                <Text style={styles.incomingMetaText}>{incoming.estimatedKm} km</Text>
              </View>
              <View style={styles.incomingMetaItem}>
                <MaterialIcons name="schedule" size={13} color={Colors.textMuted} />
                <Text style={styles.incomingMetaText}>{incoming.estimatedMinutes} min</Text>
              </View>
            </View>

            <View style={styles.incomingScore}>
              <Text style={styles.incomingScoreLabel}>Puntuación asignación (VAR)</Text>
              <Text style={styles.incomingScoreValue}>{incoming.assignmentScore.toFixed(1)}</Text>
            </View>

            <View style={styles.incomingActions}>
              <Pressable
                style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.75 }]}
                onPress={handleReject}
              >
                <MaterialIcons name="close" size={20} color={Colors.error} />
                <Text style={styles.rejectText}>Rechazar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.88 }]}
                onPress={handleAccept}
              >
                <MaterialIcons name="check" size={20} color={Colors.textInverse} />
                <Text style={styles.acceptText}>{incoming.price}€ · Aceptar</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Viaje activo */}
        {activeRide && (
          <View style={[styles.incomingCard, { borderColor: activeRide.estado === 'en_curso' ? Colors.success : Colors.primaryBorder }]}>
            <View style={styles.incomingTop}>
              <View style={styles.incomingBadgeRow}>
                <View style={[styles.airportBadge, { backgroundColor: activeRide.estado === 'en_curso' ? Colors.success : Colors.primary }]}>
                  <MaterialIcons name={activeRide.estado === 'en_curso' ? 'directions-car' : 'check-circle'} size={12} color={Colors.textInverse} />
                  <Text style={styles.airportBadgeText}>
                    {activeRide.estado === 'en_curso' ? 'EN RUTA' : 'ACEPTADO'}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.primary }}>{activeRide.price}€</Text>
            </View>
            <View style={styles.incomingRoute}>
              <View style={styles.incomingRoutePoint}>
                <View style={styles.incomingDot} />
                <Text style={styles.incomingOrigin} numberOfLines={1}>{activeRide.origin}</Text>
              </View>
              <View style={styles.incomingLine} />
              <View style={styles.incomingRoutePoint}>
                <MaterialIcons name="flight-takeoff" size={14} color={Colors.primary} />
                <Text style={styles.incomingDest} numberOfLines={1}>{activeRide.destination}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Cliente: {activeRide.clientName}</Text>
            <View style={styles.incomingActions}>
              {activeRide.estado === 'confirmada' && (
                <Pressable
                  style={({ pressed }) => [styles.acceptBtn, { flex: 1 }, pressed && { opacity: 0.88 }]}
                  onPress={() => {
                    fetch(`${API_BASE}/api/reservas/iniciar`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reserva_id: activeRide.reservaId, conductor_id: conductorId, session_token: sessionToken }),
                    }).then(r => r.json()).then(d => {
                      if (d.ok) setActiveRide((r: any) => ({ ...r, estado: 'en_curso' }));
                      else console.error('[DriverHome] iniciar:', d.error);
                    }).catch(e => console.error('[DriverHome] iniciar fetch:', e));
                  }}
                >
                  <MaterialIcons name="directions-car" size={20} color={Colors.textInverse} />
                  <Text style={styles.acceptText}>Iniciar viaje</Text>
                </Pressable>
              )}
              {activeRide.estado === 'en_curso' && (
                <Pressable
                  style={({ pressed }) => [styles.acceptBtn, { flex: 1, backgroundColor: Colors.success }, pressed && { opacity: 0.88 }]}
                  onPress={() => {
                    fetch(`${API_BASE}/api/reservas/finalizar`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reserva_id: activeRide.reservaId, conductor_id: conductorId, session_token: sessionToken }),
                    }).then(r => r.json()).then(d => {
                      if (d.ok) setActiveRide(null);
                      else console.error('[DriverHome] finalizar:', d.error);
                    }).catch(e => console.error('[DriverHome] finalizar fetch:', e));
                  }}
                >
                  <MaterialIcons name="flag" size={20} color={Colors.textInverse} />
                  <Text style={styles.acceptText}>Finalizar viaje</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Servicios rechazados recuperables */}
        {rechazadas.length > 0 && !incoming && available && (
          <View style={styles.recoverySection}>
            <Pressable
              style={styles.recoveryHeader}
              onPress={() => setMostrarRechazadas(m => !m)}
            >
              <MaterialIcons name="undo" size={16} color={Colors.textMuted} />
              <Text style={styles.recoveryHeaderText}>
                {rechazadas.length} {rechazadas.length === 1 ? 'servicio rechazado' : 'servicios rechazados'}
              </Text>
              <MaterialIcons
                name={mostrarRechazadas ? 'expand-less' : 'expand-more'}
                size={18}
                color={Colors.textMuted}
              />
            </Pressable>
            {mostrarRechazadas && rechazadas.map(r => (
              <View key={r.id} style={styles.recoveryItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recoveryOrigin} numberOfLines={1}>{r.origin}</Text>
                  <Text style={styles.recoveryDest} numberOfLines={1}>{r.destination}</Text>
                </View>
                <Text style={styles.recoveryPrice}>{r.price}€</Text>
                <Pressable
                  style={({ pressed }) => [styles.recoveryBtn, pressed && { opacity: 0.75 }]}
                  onPress={() => handleRecover(r)}
                >
                  <Text style={styles.recoveryBtnText}>Recuperar</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Zone oracle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oráculo de zonas</Text>
          {ZONE_DATA.map(z => (
            <View key={z.zone} style={styles.zoneCard}>
              <View style={styles.zoneLeft}>
                <Text style={styles.zoneName}>{z.zone}</Text>
                <Text style={styles.zoneDetail}>{z.detail}</Text>
              </View>
              <View style={styles.zoneMeter}>
                <View style={[styles.zoneMeterFill, { width: `${z.demand * 100}%`, backgroundColor: z.color }]} />
              </View>
              <Text style={[styles.zonePct, { color: z.color }]}>{Math.round(z.demand * 100)}%</Text>
            </View>
          ))}
        </View>

        {/* Maintenance alert */}
        <View style={styles.maintAlert}>
          <MaterialIcons name="build" size={18} color={Colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.maintTitle}>Revisión próxima en 450 km</Text>
            <Text style={styles.maintSub}>{driver.vehicle.model} · {driver.vehicle.plate}</Text>
          </View>
          <Pressable style={styles.maintBtn}>
            <Text style={styles.maintBtnText}>Ver</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const ZONE_DATA = [
  { zone: 'T4 Barajas', detail: 'Alta demanda · Poca competencia', demand: 0.87, color: Colors.success },
  { zone: 'Las Rozas', detail: 'Demanda media · Normal', demand: 0.62, color: Colors.primary },
  { zone: 'Pozuelo', detail: 'Moderada · Mucha competencia', demand: 0.44, color: Colors.warning },
  { zone: 'Majadahonda', detail: 'Baja · Zona residencial', demand: 0.31, color: Colors.textMuted },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  greeting: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  subGreeting: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  availBadgeOn: { backgroundColor: Colors.successMuted, borderColor: 'rgba(34,197,94,0.3)' },
  availBadgeOff: { backgroundColor: Colors.surface, borderColor: Colors.border },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availDotOn: { backgroundColor: Colors.success },
  availDotOff: { backgroundColor: Colors.textMuted },
  availText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  availTextOn: { color: Colors.success },
  availTextOff: { color: Colors.textMuted },

  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  earningsMain: { flex: 1 },
  earningsLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium },
  earningsAmount: { fontSize: Typography.xxxl, fontWeight: Typography.extrabold, color: Colors.primary, marginTop: 2 },
  earningsDivider: { width: 1, height: 48, backgroundColor: Colors.border },
  earningsStat: { alignItems: 'center', flex: 0.8 },
  statValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warningMuted,
    borderWidth: 1,
    borderColor: 'rgba(245,159,11,0.25)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  motivationText: { flex: 1, fontSize: Typography.sm, color: Colors.warning, fontWeight: Typography.medium },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },

  modoRow: { flexDirection: 'row', gap: Spacing.sm },
  modoBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modoBtnActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryBorder },
  modoTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  modoTitleActive: { color: Colors.primary },
  modoDesc: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },

  incomingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    gap: Spacing.sm,
  },
  incomingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  incomingBadgeRow: { flexDirection: 'row', gap: Spacing.xs },
  airportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  airportBadgeText: { fontSize: 10, fontWeight: Typography.extrabold, color: Colors.textInverse },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningMuted,
    borderWidth: 1,
    borderColor: 'rgba(245,159,11,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  vipBadgeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.warning },
  countdownWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: { fontSize: Typography.sm, fontWeight: Typography.extrabold, color: Colors.primary },
  countdownUrgent: { color: Colors.error },

  incomingRoute: { gap: 4 },
  incomingRoutePoint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  incomingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
  },
  incomingLine: { width: 1.5, height: 10, backgroundColor: Colors.border, marginLeft: 3.25 },
  incomingOrigin: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  incomingDest: { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },

  incomingMeta: { flexDirection: 'row', gap: Spacing.md },
  incomingMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  incomingMetaText: { fontSize: Typography.xs, color: Colors.textMuted },

  incomingScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
  },
  incomingScoreLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  incomingScoreValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },

  incomingActions: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: Radius.full,
    paddingVertical: 13,
  },
  rejectText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.error },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 13,
    ...Shadows.gold,
  },
  acceptText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textInverse },

  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneLeft: { flex: 1 },
  zoneName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  zoneDetail: { fontSize: Typography.xs, color: Colors.textMuted },
  zoneMeter: {
    width: 80,
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  zoneMeterFill: { height: '100%', borderRadius: 3 },
  zonePct: { fontSize: Typography.sm, fontWeight: Typography.bold, width: 36, textAlign: 'right' },

  maintAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warningMuted,
    borderWidth: 1,
    borderColor: 'rgba(245,159,11,0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  maintTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.warning },
  maintSub: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  maintBtn: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  maintBtnText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textInverse },

  recoverySection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  recoveryHeaderText: { flex: 1, fontSize: Typography.sm, color: Colors.textMuted },
  recoveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recoveryOrigin: { fontSize: Typography.xs, color: Colors.textMuted },
  recoveryDest: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  recoveryPrice: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  recoveryBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recoveryBtnText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textPrimary },
});

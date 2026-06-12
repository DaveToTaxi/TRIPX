import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useBooking } from '@/hooks/useBooking';
import { BOOKING_STATES } from '@/constants/config';
import { useAlert } from '@/template';
import { supabase } from '@/services/supabase';

function supabaseEstadoToLocal(estado: string, conductorId: string | null): string {
  if (estado === 'pendiente') return 'confirmada';
  if (estado === 'confirmada' && conductorId) return 'conductor_confirmado';
  if (estado === 'en_camino') return 'en_camino';
  if (estado === 'llegando') return 'llegando';
  if (estado === 'cliente_a_bordo') return 'cliente_a_bordo';
  if (estado === 'en_ruta') return 'en_ruta';
  if (estado === 'completada') return 'finalizada';
  if (estado === 'cancelada') return 'cancelada';
  return 'confirmada';
}

const ORDERED_STATES = [
  'solicitada',
  'confirmada',
  'conductor_asignado',
  'conductor_confirmado',
  'en_camino',
  'llegando',
  'cliente_a_bordo',
  'en_ruta',
  'finalizada',
] as const;

type StepState = 'done' | 'current' | 'upcoming';

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getBooking, updateBookingState } = useBooking();
  const { showAlert } = useAlert();

  const booking = getBooking(id);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`tracking-${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservas' },
        (payload) => {
          const row = payload.new as any;
          if (row.reserva_id !== id) return;
          const newState = supabaseEstadoToLocal(row.estado, row.conductor_id);
          updateBookingState(id, newState);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (!booking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textSecondary }}>Reserva no encontrada</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: Colors.primary, marginTop: 8 }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const currentStateIndex = ORDERED_STATES.indexOf(booking.state as any);
  const isCompleted = ['finalizada', 'cerrada'].includes(booking.state);
  const isCancelled = booking.state === 'cancelada';

  const getStepState = (stateName: string): StepState => {
    const stateIdx = ORDERED_STATES.indexOf(stateName as any);
    if (stateIdx < currentStateIndex) return 'done';
    if (stateIdx === currentStateIndex) return 'current';
    return 'upcoming';
  };

  const handleCall = () => {
    Linking.openURL(`tel:${booking.driverPhone}`);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hola David, soy ${booking.id}. Te llamo por mi reserva.`);
    Linking.openURL(`whatsapp://send?phone=${booking.driverPhone}&text=${msg}`);
  };

  const handleShare = () => {
    showAlert(
      'Compartir seguimiento',
      'Esta función permite a un familiar seguir tu viaje en tiempo real. Disponible próximamente.',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Seguimiento</Text>
          <Text style={styles.headerSub}>{booking.id}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
          onPress={handleShare}
        >
          <MaterialIcons name="share" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current state hero */}
        <View style={[styles.stateHero, isCancelled && styles.stateHeroCancelled]}>
          <View style={styles.stateIconCircle}>
            <MaterialIcons
              name={BOOKING_STATES[booking.state]?.icon as any ?? 'radio-button-unchecked'}
              size={32}
              color={isCancelled ? Colors.error : Colors.primary}
            />
          </View>
          <Text style={styles.stateHeroTitle}>
            {BOOKING_STATES[booking.state]?.label ?? booking.state}
          </Text>
          <Text style={styles.stateHeroSub}>
            {formatDateTime(booking.scheduledFor)}
          </Text>
        </View>

        {/* Route summary */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeDotWrap}>
              <View style={styles.routeDotOrigin} />
              <View style={styles.routeVertLine} />
              <MaterialIcons name="flight-takeoff" size={14} color={Colors.primary} />
            </View>
            <View style={styles.routeTexts}>
              <Text style={styles.routeOriginText} numberOfLines={1}>{booking.origin}</Text>
              <Text style={styles.routeDestText} numberOfLines={1}>{booking.destination}</Text>
            </View>
          </View>
          <View style={styles.routeMeta}>
            <View style={styles.routeMetaItem}>
              <MaterialIcons name="person" size={13} color={Colors.textMuted} />
              <Text style={styles.routeMetaText}>{booking.seats} pax</Text>
            </View>
            <View style={styles.routeMetaItem}>
              <MaterialIcons name="luggage" size={13} color={Colors.textMuted} />
              <Text style={styles.routeMetaText}>{booking.luggage} maletas</Text>
            </View>
            <View style={styles.routeMetaItem}>
              <MaterialIcons name="credit-card" size={13} color={Colors.textMuted} />
              <Text style={styles.routeMetaText}>{booking.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}</Text>
            </View>
            <View style={[styles.priceTag]}>
              <Text style={styles.priceTagText}>{booking.priceClosed}€</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        {!isCancelled && (
          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>Estado del servicio</Text>
            {ORDERED_STATES.map((stateName, i) => {
              const stepState = getStepState(stateName);
              const info = BOOKING_STATES[stateName];
              return (
                <View key={stateName} style={styles.timelineItem}>
                  {/* Connector */}
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      stepState === 'done' && styles.timelineDotDone,
                      stepState === 'current' && styles.timelineDotCurrent,
                    ]}>
                      {stepState === 'done' ? (
                        <MaterialIcons name="check" size={12} color={Colors.textInverse} />
                      ) : stepState === 'current' ? (
                        <MaterialIcons name={info.icon as any} size={12} color={Colors.textInverse} />
                      ) : null}
                    </View>
                    {i < ORDERED_STATES.length - 1 && (
                      <View style={[
                        styles.timelineConnector,
                        stepState === 'done' && styles.timelineConnectorDone,
                      ]} />
                    )}
                  </View>
                  <View style={[styles.timelineContent, stepState === 'upcoming' && { opacity: 0.4 }]}>
                    <Text style={[
                      styles.timelineLabel,
                      stepState === 'current' && styles.timelineLabelCurrent,
                    ]}>
                      {info.label}
                    </Text>
                    {stepState === 'current' && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Ahora</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Confirmations */}
        <View style={styles.confirmSection}>
          <Text style={styles.confirmTitle}>Confirmaciones del conductor</Text>
          {booking.confirmations.map((conf) => (
            <View key={conf.hito} style={styles.confirmItem}>
              <View style={[
                styles.confirmIcon,
                conf.status === 'done' && styles.confirmIconDone,
                conf.status === 'pending' && styles.confirmIconPending,
              ]}>
                <MaterialIcons
                  name={conf.status === 'done' ? 'check' : conf.status === 'pending' ? 'access-time' : 'radio-button-unchecked'}
                  size={14}
                  color={conf.status === 'done' ? Colors.success : conf.status === 'pending' ? Colors.warning : Colors.textMuted}
                />
              </View>
              <View style={styles.confirmText}>
                <Text style={[styles.confirmLabel, conf.status === 'upcoming' && { color: Colors.textMuted }]}>
                  {conf.label}
                </Text>
                {conf.confirmedAt && (
                  <Text style={styles.confirmTime}>
                    {new Date(conf.confirmedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
              <View style={[
                styles.confirmStatus,
                conf.status === 'done' && styles.confirmStatusDone,
                conf.status === 'pending' && styles.confirmStatusPending,
              ]}>
                <Text style={[
                  styles.confirmStatusText,
                  conf.status === 'done' && { color: Colors.success },
                  conf.status === 'pending' && { color: Colors.warning },
                ]}>
                  {conf.status === 'done' ? 'Confirmado' : conf.status === 'pending' ? 'Pendiente' : 'Próximo'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarLetter}>D</Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{booking.driverName}</Text>
            <Text style={styles.driverSub}>{booking.vehicleModel} · {booking.vehiclePlate}</Text>
            <View style={styles.driverRatingRow}>
              <MaterialIcons name="star" size={13} color={Colors.primary} />
              <Text style={styles.driverRating}>{booking.driverRating}</Text>
              <Text style={styles.driverRatingSep}>·</Text>
              <Text style={styles.driverVerified}>Verificado</Text>
            </View>
          </View>
          <View style={styles.driverActions}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
              onPress={handleCall}
            >
              <MaterialIcons name="phone" size={20} color={Colors.primary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnWa, pressed && { opacity: 0.7 }]}
              onPress={handleWhatsApp}
            >
              <MaterialIcons name="chat" size={20} color={Colors.success} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  headerSub: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },

  stateHero: {
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.gold,
  },
  stateHeroCancelled: {
    backgroundColor: Colors.errorMuted,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  stateIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,197,24,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateHeroTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  stateHeroSub: { fontSize: Typography.sm, color: Colors.textSecondary },

  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  routeRow: { flexDirection: 'row', gap: Spacing.sm },
  routeDotWrap: { alignItems: 'center', gap: 3 },
  routeDotOrigin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
  },
  routeVertLine: { width: 1.5, flex: 1, backgroundColor: Colors.border },
  routeTexts: { flex: 1, justifyContent: 'space-between', gap: Spacing.xs },
  routeOriginText: { fontSize: Typography.sm, color: Colors.textSecondary },
  routeDestText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  routeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  routeMetaText: { fontSize: Typography.xs, color: Colors.textMuted },
  priceTag: {
    marginLeft: 'auto',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  priceTagText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary },

  timeline: { gap: Spacing.xs },
  timelineTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  timelineItem: { flexDirection: 'row', gap: Spacing.sm, minHeight: 44 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  timelineDotCurrent: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 3,
  },
  timelineConnectorDone: { backgroundColor: Colors.success },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  timelineLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  timelineLabelCurrent: { color: Colors.primary, fontWeight: Typography.bold },
  currentBadge: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  currentBadgeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.primary },

  confirmSection: { gap: Spacing.sm },
  confirmTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  confirmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIconDone: { backgroundColor: Colors.successMuted },
  confirmIconPending: { backgroundColor: Colors.warningMuted },
  confirmText: { flex: 1 },
  confirmLabel: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium },
  confirmTime: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  confirmStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
  },
  confirmStatusDone: { backgroundColor: Colors.successMuted },
  confirmStatusPending: { backgroundColor: Colors.warningMuted },
  confirmStatusText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted },

  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarLetter: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.primary },
  driverDetails: { flex: 1 },
  driverName: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  driverSub: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  driverRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  driverRating: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary },
  driverRatingSep: { color: Colors.textMuted, fontSize: Typography.xs },
  driverVerified: { fontSize: Typography.xs, color: Colors.success },
  driverActions: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnWa: {
    backgroundColor: Colors.successMuted,
    borderColor: 'rgba(34,197,94,0.25)',
  },
});

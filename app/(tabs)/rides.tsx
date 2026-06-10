import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useBooking } from '@/hooks/useBooking';
import { BOOKING_STATES } from '@/constants/config';
import { Booking } from '@/services/mockData';

const STATE_COLORS: Record<string, string> = {
  solicitada: Colors.statePending,
  confirmada: Colors.statePending,
  conductor_asignado: Colors.statePending,
  conductor_confirmado: Colors.stateActive,
  en_camino: Colors.stateActive,
  llegando: Colors.stateActive,
  cliente_a_bordo: Colors.stateActive,
  en_ruta: Colors.stateActive,
  finalizada: Colors.stateCompleted,
  cerrada: Colors.stateCompleted,
  cancelada: Colors.stateCancelled,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function BookingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const stateInfo = BOOKING_STATES[booking.state];
  const stateColor = STATE_COLORS[booking.state] || Colors.textMuted;
  const isActive = !['finalizada', 'cerrada', 'cancelada'].includes(booking.state);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIdRow}>
          <Text style={styles.cardId}>{booking.id}</Text>
          {isActive && <View style={styles.activePulseDot} />}
        </View>
        <View style={[styles.stateBadge, { backgroundColor: `${stateColor}18`, borderColor: `${stateColor}40` }]}>
          <Text style={[styles.stateText, { color: stateColor }]}>{stateInfo.label}</Text>
        </View>
      </View>

      <View style={styles.routeLine}>
        <View style={styles.routeDots}>
          <View style={styles.originDot} />
          <View style={styles.routeConnector} />
          <MaterialIcons name="flight-takeoff" size={14} color={Colors.primary} />
        </View>
        <View style={styles.routeTexts}>
          <Text style={styles.routeOrigin} numberOfLines={1}>{booking.origin}</Text>
          <Text style={styles.routeDest} numberOfLines={1}>{booking.destination}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.cardMeta}>
          <MaterialIcons name="access-time" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{formatDate(booking.scheduledFor)}</Text>
        </View>
        <View style={styles.cardMeta}>
          <MaterialIcons name="person" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{booking.driverName} ★{booking.driverRating}</Text>
        </View>
        <Text style={styles.cardPrice}>{booking.priceClosed}€</Text>
      </View>
    </Pressable>
  );
}

export default function RidesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookings } = useBooking();
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const filtered = bookings.filter(b => {
    if (filter === 'active') return !['finalizada', 'cerrada', 'cancelada'].includes(b.state);
    if (filter === 'done') return ['finalizada', 'cerrada'].includes(b.state);
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.headerTitle}>Mis viajes</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f.id}
            style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
            onPress={() => setFilter(f.id as any)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Sin viajes aquí</Text>
            <Text style={styles.emptySub}>Reserva tu primer traslado al aeropuerto</Text>
          </View>
        ) : (
          filtered.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onPress={() => router.push(`/tracking/${b.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'done', label: 'Finalizados' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primaryBorder,
  },
  filterText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardId: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  activePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  stateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  stateText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  routeLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeDots: { alignItems: 'center', gap: 3 },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
  },
  routeConnector: {
    width: 1.5,
    height: 12,
    backgroundColor: Colors.border,
  },
  routeTexts: { flex: 1, gap: 4 },
  routeOrigin: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  routeDest: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.xs, color: Colors.textMuted },
  cardPrice: {
    marginLeft: 'auto',
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  emptySub: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { POPULAR_ROUTES, APP_CONFIG } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';
import { BOOKING_STATES } from '@/constants/config';
import DriverHomeScreen from '@/components/feature/DriverHomeScreen';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { activeBooking, updateDraft } = useBooking();

  if (user?.role === 'conductor') {
    return <DriverHomeScreen />;
  }

  const handleRouteSelect = (origin: string, destination: string, price: number) => {
    updateDraft({ origin, destination, isAirport: true, priceClosed: price });
    router.push('/booking');
  };

  const currentStateInfo = activeBooking
    ? BOOKING_STATES[activeBooking.state]
    : null;

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
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'viajero'}</Text>
            <Text style={styles.subGreeting}>¿A dónde vamos hoy?</Text>
          </View>
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={14} color={Colors.primary} />
            <Text style={styles.ratingText}>{APP_CONFIG.driverRating}</Text>
          </View>
        </View>

        {/* Active booking banner */}
        {activeBooking && (
          <Pressable
            style={({ pressed }) => [styles.activeBanner, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/tracking/${activeBooking.id}`)}
          >
            <View style={styles.activeBannerLeft}>
              <View style={styles.activeDot} />
              <View>
                <Text style={styles.activeBannerTitle}>Reserva activa</Text>
                <Text style={styles.activeBannerSub}>
                  {currentStateInfo?.label} · {activeBooking.id}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.primary} />
          </Pressable>
        )}

        {/* Hero card */}
        <Pressable
          style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.92 }]}
          onPress={() => router.push('/booking')}
        >
          <Image
            source={require('@/assets/images/hero-airport.jpg')}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <MaterialIcons name="flight-takeoff" size={13} color={Colors.textInverse} />
                <Text style={styles.heroBadgeText}>PRECIO CERRADO</Text>
              </View>
              <Text style={styles.heroTitle}>Tu vuelo,{'\n'}nuestra garantía</Text>
              <Text style={styles.heroSub}>
                Conductor confirmado · Persona real · Sin sorpresas
              </Text>
              <View style={styles.heroBtn}>
                <Text style={styles.heroBtnText}>Reservar ahora</Text>
                <MaterialIcons name="arrow-forward" size={16} color={Colors.textInverse} />
              </View>
            </View>
          </View>
        </Pressable>

        {/* Trust row */}
        <View style={styles.trustRow}>
          {TRUST_ITEMS.map((item) => (
            <View key={item.label} style={styles.trustItem}>
              <MaterialIcons name={item.icon as any} size={20} color={Colors.primary} />
              <Text style={styles.trustLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Popular routes */}
        <Text style={styles.sectionTitle}>Rutas frecuentes</Text>
        {POPULAR_ROUTES.map((route, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [styles.routeCard, pressed && { opacity: 0.85 }]}
            onPress={() => handleRouteSelect(route.origin, route.destination, route.price)}
          >
            <View style={styles.routeLeft}>
              <View style={styles.routeIconWrap}>
                <MaterialIcons name="flight-takeoff" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.routeFrom}>{route.origin}</Text>
                <View style={styles.routeArrow}>
                  <Text style={styles.routeTo}>{route.destination}</Text>
                </View>
              </View>
            </View>
            <View style={styles.routeRight}>
              <Text style={styles.routePrice}>{route.price}€</Text>
              <Text style={styles.routeTime}>{route.minutes} min</Text>
            </View>
          </Pressable>
        ))}

        {/* Bottom CTA */}
        <View style={styles.ctaCard}>
          <MaterialIcons name="headset-mic" size={24} color={Colors.primary} />
          <View style={styles.ctaText}>
            <Text style={styles.ctaTitle}>¿Necesitas ayuda?</Text>
            <Text style={styles.ctaSub}>Llámanos. Una persona real te atiende.</Text>
          </View>
          <Pressable style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>{APP_CONFIG.phone}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const TRUST_ITEMS = [
  { label: 'Confirmado', icon: 'verified' },
  { label: 'Puntual', icon: 'access-time' },
  { label: 'Precio fijo', icon: 'local-offer' },
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
  greeting: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  ratingText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },

  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  activeBannerTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  activeBannerSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  heroCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 220,
    ...Shadows.lg,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 26, 0.7)',
    justifyContent: 'flex-end',
  },
  heroContent: { padding: Spacing.lg },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: Typography.extrabold,
    color: Colors.textInverse,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    lineHeight: Typography.xxl * 1.25,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.sm,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textInverse,
  },

  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustItem: { alignItems: 'center', gap: 5 },
  trustLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },

  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },

  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  routeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeFrom: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  routeArrow: { flexDirection: 'row', alignItems: 'center' },
  routeTo: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  routeRight: { alignItems: 'flex-end' },
  routePrice: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  routeTime: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
  },
  ctaText: { flex: 1 },
  ctaTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  ctaSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ctaBtn: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  ctaBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { APP_CONFIG } from '@/constants/config';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, switchRole } = useAuth();

  const isDriver = user?.role === 'conductor';

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
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) ?? 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          <View style={[styles.roleBadge, isDriver && styles.roleBadgeDriver]}>
            <MaterialIcons
              name={isDriver ? 'directions-car' : 'person'}
              size={13}
              color={isDriver ? Colors.warning : Colors.primary}
            />
            <Text style={[styles.roleText, isDriver && styles.roleTextDriver]}>
              {isDriver ? 'Conductor' : 'Pasajero'}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        {isDriver ? (
          <View style={styles.statsRow}>
            {DRIVER_STATS.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.statsRow}>
            {PASSENGER_STATS.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* MOCK LOGIN INDICATOR */}
        <View style={styles.mockBanner}>
          <MaterialIcons name="info" size={14} color={Colors.warning} />
          <Text style={styles.mockText}>MOCK — Cambiar rol para demo</Text>
        </View>

        {/* Role switcher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar vista (demo)</Text>
          <View style={styles.roleSwitcher}>
            <Pressable
              style={[styles.roleBtn, !isDriver && styles.roleBtnActive]}
              onPress={() => switchRole('pasajero')}
            >
              <MaterialIcons
                name="person"
                size={18}
                color={!isDriver ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.roleBtnText, !isDriver && styles.roleBtnTextActive]}>
                Pasajero
              </Text>
            </Pressable>
            <Pressable
              style={[styles.roleBtn, isDriver && styles.roleBtnActiveDriver]}
              onPress={() => switchRole('conductor')}
            >
              <MaterialIcons
                name="directions-car"
                size={18}
                color={isDriver ? Colors.warning : Colors.textMuted}
              />
              <Text style={[styles.roleBtnText, isDriver && styles.roleBtnTextDriver]}>
                Conductor
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <MaterialIcons name={item.icon as any} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.contactCard}>
          <MaterialIcons name="headset-mic" size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>{APP_CONFIG.brandName}</Text>
            <Text style={styles.contactSub}>{APP_CONFIG.phone}</Text>
          </View>
          <Text style={styles.contactRating}>★ {APP_CONFIG.driverRating}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const DRIVER_STATS = [
  { value: '4.9', label: 'Valoración' },
  { value: '847', label: 'Viajes' },
  { value: '285€', label: 'Hoy' },
];

const PASSENGER_STATS = [
  { value: '3', label: 'Viajes' },
  { value: '140€', label: 'Total' },
  { value: 'VIP', label: 'Estado' },
];

const MENU_ITEMS = [
  { label: 'Datos personales', icon: 'person-outline' },
  { label: 'Métodos de pago', icon: 'credit-card' },
  { label: 'Notificaciones', icon: 'notifications-none' },
  { label: 'Privacidad', icon: 'lock-outline' },
  { label: 'Ayuda', icon: 'help-outline' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md },

  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.xxxl, fontWeight: Typography.bold, color: Colors.primary },
  userName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  userPhone: { fontSize: Typography.sm, color: Colors.textSecondary },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  roleBadgeDriver: {
    backgroundColor: Colors.warningMuted,
    borderColor: 'rgba(245,159,11,0.3)',
  },
  roleText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.primary },
  roleTextDriver: { color: Colors.warning },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.primary },
  statLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },

  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warningMuted,
    borderWidth: 1,
    borderColor: 'rgba(245,159,11,0.3)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  mockText: { fontSize: Typography.xs, color: Colors.warning, fontWeight: Typography.semibold },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  roleSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  roleBtnActive: { backgroundColor: Colors.primaryMuted },
  roleBtnActiveDriver: { backgroundColor: Colors.warningMuted },
  roleBtnText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  roleBtnTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  roleBtnTextDriver: { color: Colors.warning, fontWeight: Typography.semibold },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },

  contactCard: {
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
  contactTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  contactSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  contactRating: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary },
});

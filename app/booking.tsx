import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { VEHICLE_CATEGORIES, AIRPORTS } from '@/constants/config';
import { useBooking } from '@/hooks/useBooking';
import { useAlert } from '@/template';

type Step = 'route' | 'options' | 'price';

const PRICE_TABLE: Record<string, Record<string, number>> = {
  estandar: { 'T1': 42, 'T2': 43, 'T4': 45, 'T4S': 47 },
  grande: { 'T1': 57, 'T2': 58, 'T4': 60, 'T4S': 62 },
  premium: { 'T1': 67, 'T2': 68, 'T4': 70, 'T4S': 72 },
  electrico: { 'T1': 62, 'T2': 63, 'T4': 65, 'T4S': 67 },
};

function calcPrice(origin: string, category: string, terminal: string): number {
  const base = PRICE_TABLE[category]?.[terminal] ?? 45;
  if (origin.toLowerCase().includes('pozuelo')) return base + 5;
  if (origin.toLowerCase().includes('majadahonda')) return base + 3;
  return base;
}

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, updateDraft, confirmBooking } = useBooking();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<Step>('route');
  const [originInput, setOriginInput] = useState(draft.origin);
  const [destinationInput, setDestinationInput] = useState(draft.destination);
  const [isAirport, setIsAirport] = useState(draft.isAirport || true);
  const [terminal, setTerminal] = useState(draft.terminal || 'T4');
  const [seats, setSeats] = useState(draft.seats || 1);
  const [luggage, setLuggage] = useState(draft.luggage || 1);
  const [vehicleCategory, setVehicleCategory] = useState(draft.vehicleCategory || 'estandar');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>(draft.paymentMethod || 'tarjeta');

  const estimatedPrice = calcPrice(originInput || 'Las Rozas', vehicleCategory, terminal);

  const handleNext = () => {
    if (step === 'route') {
      if (!originInput.trim()) {
        showAlert('Dirección requerida', 'Por favor indica tu dirección de recogida');
        return;
      }
      updateDraft({ origin: originInput, destination: isAirport ? `Barajas ${terminal}` : destinationInput, isAirport, terminal });
      setStep('options');
    } else if (step === 'options') {
      updateDraft({ seats, luggage, vehicleCategory, paymentMethod });
      setStep('price');
    }
  };

  const handleConfirm = () => {
    updateDraft({
      origin: originInput,
      destination: `Madrid Barajas ${terminal}`,
      isAirport,
      terminal,
      seats,
      luggage,
      vehicleCategory,
      paymentMethod,
      priceClosed: estimatedPrice,
    });
    const id = confirmBooking();
    showAlert(
      'Reserva confirmada',
      `Tu traslado ha sido confirmado. David te contactará pronto.\n\nReferencia: ${id}`,
      [{ text: 'Ver seguimiento', onPress: () => router.replace(`/tracking/${id}`) }]
    );
  };

  const STEP_LABELS = ['Ruta', 'Opciones', 'Precio'];
  const STEP_INDEX = { route: 0, options: 1, price: 2 };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => {
            if (step === 'route') router.back();
            else if (step === 'options') setStep('route');
            else setStep('options');
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nueva reserva</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {STEP_LABELS.map((label, i) => (
          <View key={label} style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              i <= STEP_INDEX[step] && styles.progressDotActive,
            ]}>
              {i < STEP_INDEX[step] ? (
                <MaterialIcons name="check" size={12} color={Colors.textInverse} />
              ) : (
                <Text style={[styles.progressNum, i === STEP_INDEX[step] && styles.progressNumActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i === STEP_INDEX[step] && styles.progressLabelActive]}>
              {label}
            </Text>
            {i < STEP_LABELS.length - 1 && (
              <View style={[styles.progressLine, i < STEP_INDEX[step] && styles.progressLineActive]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: Route */}
        {step === 'route' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¿De dónde te recogemos?</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección de recogida</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="my-location" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={originInput}
                  onChangeText={setOriginInput}
                  placeholder="Calle, número, ciudad..."
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggleBtn, isAirport && styles.toggleBtnActive]}
                onPress={() => setIsAirport(true)}
              >
                <MaterialIcons
                  name="flight-takeoff"
                  size={18}
                  color={isAirport ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.toggleText, isAirport && styles.toggleTextActive]}>
                  Al aeropuerto
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleBtn, !isAirport && styles.toggleBtnActive]}
                onPress={() => setIsAirport(false)}
              >
                <MaterialIcons
                  name="location-on"
                  size={18}
                  color={!isAirport ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.toggleText, !isAirport && styles.toggleTextActive]}>
                  Otro destino
                </Text>
              </Pressable>
            </View>

            {isAirport ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Terminal Barajas</Text>
                <View style={styles.terminalRow}>
                  {AIRPORTS.map(a => (
                    <Pressable
                      key={a.id}
                      style={[styles.terminalBtn, terminal === a.id && styles.terminalBtnActive]}
                      onPress={() => setTerminal(a.id)}
                    >
                      <Text style={[styles.terminalText, terminal === a.id && styles.terminalTextActive]}>
                        {a.id}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Destino</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="location-on" size={18} color={Colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={destinationInput}
                    onChangeText={setDestinationInput}
                    placeholder="Destino..."
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
            )}

            {/* Airport reassurance */}
            {isAirport && (
              <View style={styles.reassuranceCard}>
                <MaterialIcons name="verified" size={20} color={Colors.success} />
                <Text style={styles.reassuranceText}>
                  Precio cerrado · Sin sorpresas · David confirma personalmente
                </Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 2: Options */}
        {step === 'options' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Personaliza tu traslado</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pasajeros y equipaje</Text>
              <View style={styles.counterRow}>
                <View style={styles.counter}>
                  <MaterialIcons name="person" size={16} color={Colors.textSecondary} />
                  <Text style={styles.counterLabel}>Personas</Text>
                  <View style={styles.counterBtns}>
                    <Pressable style={styles.counterBtn} onPress={() => setSeats(Math.max(1, seats - 1))}>
                      <MaterialIcons name="remove" size={16} color={Colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.counterValue}>{seats}</Text>
                    <Pressable style={styles.counterBtn} onPress={() => setSeats(Math.min(7, seats + 1))}>
                      <MaterialIcons name="add" size={16} color={Colors.textPrimary} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.counter}>
                  <MaterialIcons name="luggage" size={16} color={Colors.textSecondary} />
                  <Text style={styles.counterLabel}>Maletas</Text>
                  <View style={styles.counterBtns}>
                    <Pressable style={styles.counterBtn} onPress={() => setLuggage(Math.max(0, luggage - 1))}>
                      <MaterialIcons name="remove" size={16} color={Colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.counterValue}>{luggage}</Text>
                    <Pressable style={styles.counterBtn} onPress={() => setLuggage(Math.min(10, luggage + 1))}>
                      <MaterialIcons name="add" size={16} color={Colors.textPrimary} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Categoría de vehículo</Text>
              {VEHICLE_CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[styles.vehicleCard, vehicleCategory === cat.id && styles.vehicleCardActive]}
                  onPress={() => setVehicleCategory(cat.id)}
                >
                  <View style={[styles.vehicleIconWrap, vehicleCategory === cat.id && styles.vehicleIconWrapActive]}>
                    <MaterialIcons
                      name={cat.icon as any}
                      size={20}
                      color={vehicleCategory === cat.id ? Colors.primary : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={[styles.vehicleName, vehicleCategory === cat.id && styles.vehicleNameActive]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.vehicleDesc}>{cat.desc}</Text>
                  </View>
                  {cat.extra ? (
                    <Text style={styles.vehicleExtra}>{cat.extra}</Text>
                  ) : (
                    vehicleCategory === cat.id && (
                      <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                    )
                  )}
                </Pressable>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Forma de pago</Text>
              <View style={styles.paymentRow}>
                {PAYMENT_OPTS.map(p => (
                  <Pressable
                    key={p.id}
                    style={[styles.paymentBtn, paymentMethod === p.id && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod(p.id as any)}
                  >
                    <MaterialIcons
                      name={p.icon as any}
                      size={18}
                      color={paymentMethod === p.id ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.paymentText, paymentMethod === p.id && styles.paymentTextActive]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: Price & Confirm */}
        {step === 'price' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Resumen de tu reserva</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRoute}>
                <View style={styles.summaryPoint}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryOrigin} numberOfLines={1}>{originInput}</Text>
                </View>
                <View style={styles.summaryLine} />
                <View style={styles.summaryPoint}>
                  <MaterialIcons name="flight-takeoff" size={14} color={Colors.primary} />
                  <Text style={styles.summaryDest} numberOfLines={1}>
                    Madrid Barajas {terminal}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryDetails}>
                {[
                  { icon: 'person', label: `${seats} persona${seats > 1 ? 's' : ''}` },
                  { icon: 'luggage', label: `${luggage} maleta${luggage !== 1 ? 's' : ''}` },
                  { icon: vehicleCategory === 'electrico' ? 'electric-car' : vehicleCategory === 'grande' ? 'airport-shuttle' : 'directions-car', label: VEHICLE_CATEGORIES.find(v => v.id === vehicleCategory)?.label ?? '' },
                  { icon: paymentMethod === 'tarjeta' ? 'credit-card' : 'payments', label: paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo' },
                ].map(d => (
                  <View key={d.label} style={styles.summaryDetailItem}>
                    <MaterialIcons name={d.icon as any} size={14} color={Colors.textMuted} />
                    <Text style={styles.summaryDetailText}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Price highlight */}
            <View style={styles.priceCard}>
              <View style={styles.priceLeft}>
                <Text style={styles.priceLabel}>Precio cerrado</Text>
                <Text style={styles.priceNote}>Sin sorpresas · Equipaje incluido</Text>
              </View>
              <Text style={styles.priceAmount}>{estimatedPrice}€</Text>
            </View>

            {/* Driver card */}
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>D</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>David · MadridTaxis</Text>
                <Text style={styles.driverMeta}>Seat León · 1234 ABC</Text>
              </View>
              <View style={styles.driverRatingWrap}>
                <MaterialIcons name="star" size={14} color={Colors.primary} />
                <Text style={styles.driverRating}>4.9</Text>
              </View>
            </View>

            <View style={styles.guaranteeRow}>
              {GUARANTEES.map(g => (
                <View key={g} style={styles.guaranteeItem}>
                  <MaterialIcons name="check" size={14} color={Colors.success} />
                  <Text style={styles.guaranteeText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        {step === 'price' && (
          <Text style={styles.bottomPrice}>{estimatedPrice}€ precio cerrado</Text>
        )}
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.88 }]}
          onPress={step === 'price' ? handleConfirm : handleNext}
        >
          <Text style={styles.ctaBtnText}>
            {step === 'price' ? 'Confirmar reserva' : 'Continuar'}
          </Text>
          <MaterialIcons
            name={step === 'price' ? 'check' : 'arrow-forward'}
            size={18}
            color={Colors.textInverse}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const PAYMENT_OPTS = [
  { id: 'tarjeta', label: 'Tarjeta', icon: 'credit-card' },
  { id: 'efectivo', label: 'Efectivo', icon: 'payments' },
];

const GUARANTEES = [
  'Sin recargo nocturno',
  'Equipaje gratis',
  'Cancelación con antelación',
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  progressNum: { fontSize: 11, fontWeight: Typography.bold, color: Colors.textMuted },
  progressNumActive: { color: Colors.textInverse },
  progressLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginLeft: 6 },
  progressLabelActive: { color: Colors.primary, fontWeight: Typography.semibold },
  progressLine: { flex: 1, height: 1.5, backgroundColor: Colors.border, marginHorizontal: 4 },
  progressLineActive: { backgroundColor: Colors.primary },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md },
  stepContent: { gap: Spacing.lg },
  stepTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },

  inputGroup: { gap: Spacing.sm },
  inputLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: Radius.sm,
  },
  toggleBtnActive: { backgroundColor: Colors.primaryMuted },
  toggleText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  toggleTextActive: { color: Colors.primary, fontWeight: Typography.semibold },

  terminalRow: { flexDirection: 'row', gap: Spacing.sm },
  terminalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  terminalBtnActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryBorder },
  terminalText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textMuted },
  terminalTextActive: { color: Colors.primary },

  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successMuted,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  reassuranceText: { flex: 1, fontSize: Typography.sm, color: Colors.success, fontWeight: Typography.medium },

  counterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  counter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  counterLabel: { flex: 1, fontSize: Typography.xs, color: Colors.textSecondary },
  counterBtns: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vehicleCardActive: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryMuted },
  vehicleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconWrapActive: { backgroundColor: 'rgba(245,197,24,0.2)' },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textSecondary },
  vehicleNameActive: { color: Colors.primary },
  vehicleDesc: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  vehicleExtra: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },

  paymentRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  paymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: Radius.sm,
  },
  paymentBtnActive: { backgroundColor: Colors.primaryMuted },
  paymentText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  paymentTextActive: { color: Colors.primary, fontWeight: Typography.semibold },

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  summaryRoute: { gap: Spacing.xs },
  summaryPoint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
  },
  summaryOrigin: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1 },
  summaryLine: { width: 1.5, height: 10, backgroundColor: Colors.border, marginLeft: 3.25 },
  summaryDest: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, flex: 1 },
  summaryDivider: { height: 1, backgroundColor: Colors.border },
  summaryDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  summaryDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryDetailText: { fontSize: Typography.xs, color: Colors.textSecondary },

  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.gold,
  },
  priceLeft: { flex: 1 },
  priceLabel: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  priceNote: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  priceAmount: { fontSize: Typography.xxxl, fontWeight: Typography.extrabold, color: Colors.primary },

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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.primary },
  driverInfo: { flex: 1 },
  driverName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  driverMeta: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  driverRatingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  driverRating: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary },

  guaranteeRow: { gap: Spacing.xs },
  guaranteeItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  guaranteeText: { fontSize: Typography.sm, color: Colors.textSecondary },

  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  bottomPrice: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 16,
    ...Shadows.gold,
  },
  ctaBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textInverse,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinLoginScreen() {
  const { loginConductor } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleKey = async (key: string) => {
    if (loading) return;
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    if (key === '') return;
    const newPin = pin + key;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      setLoading(true);
      const result = await loginConductor(newPin);
      setLoading(false);
      if (!result.ok) {
        setError(result.error ?? 'PIN incorrecto');
        setPin('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="directions-car" size={40} color={Colors.primary} />
        <Text style={styles.title}>Acceso Conductor</Text>
        <Text style={styles.subtitle}>Introduce tu PIN de 4 dígitos</Text>
      </View>

      <View style={styles.dotsRow}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.lg }} />
      ) : (
        <View style={styles.pad}>
          {KEYS.map((key, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.key,
                key === '' && styles.keyEmpty,
                pressed && key !== '' && styles.keyPressed,
              ]}
              onPress={() => handleKey(key)}
              disabled={key === ''}
            >
              <Text style={[styles.keyText, key === '⌫' && styles.keyBackspace]}>
                {key}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  error: {
    fontSize: Typography.sm,
    color: Colors.error,
    fontWeight: Typography.semibold,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  key: {
    width: 82,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  keyPressed: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryBorder },
  keyText: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.textPrimary },
  keyBackspace: { fontSize: Typography.xl, color: Colors.textSecondary },
});

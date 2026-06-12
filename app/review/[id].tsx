import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => router.replace('/'), 1500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {submitted ? (
        <View style={styles.thanks}>
          <MaterialIcons name="check-circle" size={64} color={Colors.success} />
          <Text style={styles.thanksText}>¡Gracias por tu valoración!</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>¿Cómo fue tu viaje?</Text>
          <Text style={styles.sub}>{id}</Text>
          <View style={styles.stars}>
            {[1,2,3,4,5].map(i => (
              <Pressable key={i} onPress={() => setRating(i)}>
                <MaterialIcons
                  name={i <= rating ? 'star' : 'star-border'}
                  size={48}
                  color={Colors.primary}
                />
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.btn, rating === 0 && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={rating === 0}
          >
            <Text style={styles.btnText}>Enviar valoración</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, padding: Spacing.xl },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: Typography.sm, color: Colors.textMuted },
  stars: { flexDirection: 'row', gap: Spacing.sm },
  btn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 16, paddingHorizontal: 48, ...Shadows.gold },
  btnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textInverse },
  thanks: { alignItems: 'center', gap: Spacing.lg },
  thanksText: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
});

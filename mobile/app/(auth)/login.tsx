import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';

interface LoginValues { email: string; password: string; }
export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useLocale();
  const [serverError, setServerError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ defaultValues: { email: '', password: '' } });
  const submit = async (values: LoginValues) => {
    setServerError('');
    try {
      await login(values.email, values.password);
      router.replace('/(tabs)');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('networkError'));
    }
  };
  return (
    <View style={styles.page}>
      <Text style={styles.brand}>{t('appName')}</Text>
      <Text style={styles.heading}>{t('login')}</Text>
      <Controller control={control} name="email" rules={{ required: t('required') }} render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.input} placeholder={t('email')} autoCapitalize="none" value={value} onBlur={onBlur} onChangeText={onChange} />} />
      {errors.email ? <Text style={styles.error}>{errors.email.message}</Text> : null}
      <Controller control={control} name="password" rules={{ required: t('required') }} render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.input} placeholder={t('password')} secureTextEntry value={value} onBlur={onBlur} onChangeText={onChange} />} />
      {errors.password ? <Text style={styles.error}>{errors.password.message}</Text> : null}
      {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
      <Pressable accessibilityLabel={t('login')} style={styles.button} disabled={isSubmitting} onPress={handleSubmit(submit)}><View style={styles.buttonContent}><SymbolView name={{ ios: 'arrow.right.circle.fill', android: 'login', web: 'login' }} size={17} tintColor="#fff" /><Text style={styles.buttonText}>{isSubmitting ? t('loading') : t('login')}</Text></View></Pressable>
      <Pressable accessibilityRole="link" accessibilityLabel={t('register')} onPress={() => router.push('/register')}><View style={styles.linkContent}><SymbolView name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }} size={16} tintColor="#087f5b" /><Text style={styles.link}>{t('register')}</Text></View></Pressable>
    </View>
  );
}
export const styles = StyleSheet.create({ page: { flex: 1, justifyContent: 'center', padding: 24, gap: 10, backgroundColor: '#f7f8f4' }, brand: { color: '#087f5b', fontSize: 38, fontWeight: '800', marginBottom: 8 }, heading: { color: '#17201c', fontSize: 25, fontWeight: '700', marginBottom: 14 }, input: { backgroundColor: '#fff', borderColor: '#d5ddd8', borderRadius: 10, borderWidth: 1, padding: 14, fontSize: 16 }, button: { alignItems: 'center', backgroundColor: '#087f5b', borderRadius: 10, marginTop: 8, padding: 15 }, buttonContent: { alignItems: 'center', flexDirection: 'row', gap: 7 }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }, linkContent: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center' }, link: { color: '#087f5b', padding: 12, textAlign: 'center' }, error: { color: '#b42318', fontSize: 13 } });
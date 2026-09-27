import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { ScreenFrame } from '@/components/screen-frame';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { styles } from './login';

interface RegisterValues { email: string; username: string; password: string; confirmPassword: string; }
export default function RegisterScreen() {
  const { register: createAccount } = useAuth(); const { t } = useLocale(); const [serverError, setServerError] = useState('');
  const { register, setValue, handleSubmit, formState: { isSubmitting } } = useForm<RegisterValues>();
  register('email', { required: t('required') }); register('username', { required: t('required') }); register('password', { required: t('required') }); register('confirmPassword', { required: t('required') });
  const field = (name: keyof RegisterValues, placeholder: string, secure = false) => <TextInput style={styles.input} placeholder={placeholder} secureTextEntry={secure} autoCapitalize="none" onChangeText={(value) => setValue(name, value)} />;
  const submit = async (values: RegisterValues) => { if (values.password !== values.confirmPassword) { setServerError(t('passwordMatch')); return; } try { await createAccount(values.email, values.username, values.password); router.replace('/(tabs)'); } catch (error) { setServerError(error instanceof Error ? error.message : t('networkError')); } };
  return <ScreenFrame keyboardAware><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled"><Text style={styles.brand}>{t('appName')}</Text><Text style={styles.heading}>{t('register')}</Text>{field('email', t('email'))}{field('username', t('username'))}{field('password', t('password'), true)}{field('confirmPassword', t('confirmPassword'), true)}{serverError ? <Text style={styles.error}>{serverError}</Text> : null}<Pressable accessibilityLabel={t('register')} style={styles.button} disabled={isSubmitting} onPress={handleSubmit(submit)}><View style={styles.buttonContent}><SymbolView name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }} size={17} tintColor="#fff" /><Text style={styles.buttonText}>{isSubmitting ? t('loading') : t('register')}</Text></View></Pressable><Pressable accessibilityRole="link" accessibilityLabel={t('login')} onPress={() => router.push('/login')}><View style={styles.linkContent}><SymbolView name={{ ios: 'arrow.left.circle', android: 'login', web: 'login' }} size={16} tintColor="#087f5b" /><Text style={styles.link}>{t('login')}</Text></View></Pressable></ScrollView></ScreenFrame>;
}
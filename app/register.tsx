import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { User, Mail, Lock } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, isAuthenticated } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Navigate to tabs when authenticated
  useEffect(() => {
    if (isAuthenticated && isMounted) {
      // Add a small delay to ensure the Root Layout is fully mounted
      const timer = setTimeout(() => {
        console.log('User is authenticated, navigating to tabs');
        router.replace('/(tabs)');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isMounted, router]);
  
  const validateForm = () => {
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    
    let isValid = true;
    
    if (!username) {
      newErrors.username = 'El nombre de usuario es requerido';
      isValid = false;
    } else if (username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      isValid = false;
    }
    
    if (!email) {
      newErrors.email = 'El email es requerido';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El email es inválido';
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      console.log('Attempting registration with:', username, email);
      await register(username, email, password);
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error en el registro');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la comunidad de juegos de cartas</Text>
          </View>
          
          <View style={styles.form}>
            <Input
              label="Nombre de Usuario"
              placeholder="Elige un nombre de usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              error={errors.username}
              leftIcon={<User size={20} color={colors.textSecondary} />}
            />
            
            <Input
              label="Email"
              placeholder="Ingresa tu email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
            />
            
            <Input
              label="Contraseña"
              placeholder="Crea una contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
            />
            
            <Input
              label="Confirmar Contraseña"
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
            />
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <Button
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />
            
            <Button
              title="¿Ya tienes una cuenta? Inicia Sesión"
              onPress={() => router.back()}
              variant="text"
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: 24,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 8,
  },
  loginButton: {
    marginTop: 16,
  },
});
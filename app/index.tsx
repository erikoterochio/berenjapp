import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { User, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
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
  
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa nombre de usuario y contraseña');
      return;
    }
    
    console.log('Attempting login with:', username, password);
    await login(username, password);
  };
  
  const handleRegister = () => {
    router.push('/register');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1585504198199-20277593b94f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }} 
            style={styles.logo}
          />
          <Text style={styles.title}>Seguidor de Juegos de Cartas</Text>
          <Text style={styles.subtitle}>Lleva el registro de tus juegos de cartas con amigos</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            label="Nombre de Usuario"
            placeholder="Ingresa tu nombre de usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            leftIcon={<User size={20} color={colors.text} />}
          />
          
          <Input
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={colors.text} />}
          />
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
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
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: colors.textSecondary,
    marginRight: 4,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
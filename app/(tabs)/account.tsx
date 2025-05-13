import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { Input } from '@/components/Input';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import * as ImagePicker from 'expo-image-picker';
import { 
  User, 
  Mail, 
  Bell, 
  Moon, 
  LogOut, 
  Shield, 
  HelpCircle, 
  Info, 
  ChevronRight,
  Edit,
  Camera,
  X
} from 'lucide-react-native';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  value?: boolean;
  isSwitch?: boolean;
  disabled?: boolean;
}

export default function AccountScreen() {
  const { user, logout, updateProfile, isLoading } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  
  // Profile editing state
  const [showEditModal, setShowEditModal] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [usernameError, setUsernameError] = useState('');
  
  // Coming soon modal state
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  
  // About modal state
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  if (!user) return null;
  
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          onPress: () => logout()
        }
      ]
    );
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    showComingSoonFeature('Modo Oscuro');
  };
  
  const toggleNotifications = () => {
    // Notifications are disabled, show coming soon
    showComingSoonFeature('Notificaciones Push');
  };
  
  const showComingSoonFeature = (feature: string) => {
    setComingSoonFeature(feature);
    setShowComingSoonModal(true);
  };
  
  const openEditProfile = () => {
    setUsername(user.username);
    setProfilePic(user.profilePic || '');
    setUsernameError('');
    setShowEditModal(true);
  };
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso Requerido', 'Por favor otorga permiso para acceder a tus fotos');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePic(result.assets[0].uri);
    }
  };
  
  const validateUsername = () => {
    if (!username.trim()) {
      setUsernameError('El nombre de usuario es requerido');
      return false;
    }
    
    if (username.length < 3) {
      setUsernameError('El nombre de usuario debe tener al menos 3 caracteres');
      return false;
    }
    
    setUsernameError('');
    return true;
  };
  
  const handleSaveProfile = async () => {
    if (!validateUsername()) return;
    
    try {
      await updateProfile({
        ...user,
        username,
        profilePic
      });
      
      setShowEditModal(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al actualizar perfil');
    }
  };
  
  const showAboutInfo = () => {
    setShowAboutModal(true);
  };
  
  const MenuItem: React.FC<MenuItemProps> = ({ 
    icon, 
    title, 
    onPress, 
    value, 
    isSwitch = false,
    disabled = false
  }) => (
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={onPress}
      disabled={isSwitch || disabled}
    >
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={[styles.menuItemTitle, disabled && styles.disabledText]}>{title}</Text>
      </View>
      
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="white"
          disabled={disabled}
        />
      ) : (
        <ChevronRight size={20} color={disabled ? colors.border : colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={openEditProfile} style={styles.avatarContainer}>
            <Avatar source={user.profilePic} name={user.username} size={80} />
            <View style={styles.editIconContainer}>
              <Edit size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <TouchableOpacity onPress={openEditProfile} style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Card title="Configuración de Cuenta">
          <MenuItem 
            icon={<User size={20} color={colors.primary} />}
            title="Editar Perfil"
            onPress={openEditProfile}
          />
          
          <MenuItem 
            icon={<Mail size={20} color={colors.primary} />}
            title="Notificaciones por Email"
            onPress={() => showComingSoonFeature('Notificaciones por Email')}
          />
          
          <MenuItem 
            icon={<Bell size={20} color={colors.primary} />}
            title="Notificaciones Push"
            value={notifications}
            onPress={toggleNotifications}
            isSwitch
            disabled={true}
          />
          
          <MenuItem 
            icon={<Moon size={20} color={colors.primary} />}
            title="Modo Oscuro"
            value={darkMode}
            onPress={toggleDarkMode}
            isSwitch
          />
        </Card>
        
        <Card title="Soporte">
          <MenuItem 
            icon={<HelpCircle size={20} color={colors.primary} />}
            title="Ayuda y Soporte"
            onPress={() => showComingSoonFeature('Ayuda y Soporte')}
          />
          
          <MenuItem 
            icon={<Shield size={20} color={colors.primary} />}
            title="Política de Privacidad"
            onPress={() => showComingSoonFeature('Política de Privacidad')}
          />
          
          <MenuItem 
            icon={<Info size={20} color={colors.primary} />}
            title="Acerca de"
            onPress={showAboutInfo}
          />
        </Card>
        
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="primary"
          icon={<LogOut size={20} color="white" />}
          style={styles.logoutButton}
          textStyle={{ color: 'white' }}
        />
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEditModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.profileImageContainer}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImagePlaceholderText}>
                      {username.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                  <Camera size={20} color="white" />
                </TouchableOpacity>
              </View>
              
              <Input
                label="Nombre de Usuario"
                value={username}
                onChangeText={setUsername}
                error={usernameError}
                placeholder="Ingresa tu nombre de usuario"
                containerStyle={styles.inputContainer}
              />
              
              <Text style={styles.noteText}>
                Nota: El email no puede ser cambiado en este momento.
              </Text>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setShowEditModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Guardar Cambios"
                onPress={handleSaveProfile}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <View style={styles.comingSoonOverlay}>
          <View style={styles.comingSoonContent}>
            <View style={styles.comingSoonIconContainer}>
              <Info size={40} color={colors.primary} />
            </View>
            
            <Text style={styles.comingSoonTitle}>¡Próximamente!</Text>
            <Text style={styles.comingSoonText}>
              La función {comingSoonFeature} no está disponible aún.
              Estamos trabajando arduamente para traértela en una actualización futura.
            </Text>
            
            <Button
              title="Entendido"
              onPress={() => setShowComingSoonModal(false)}
              style={styles.comingSoonButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.comingSoonOverlay}>
          <View style={styles.comingSoonContent}>
            <View style={styles.comingSoonIconContainer}>
              <Info size={40} color={colors.primary} />
            </View>
            
            <Text style={styles.comingSoonTitle}>Acerca de</Text>
            <Text style={styles.comingSoonText}>
              Card Game Tracker v1.0.0
            </Text>
            <Text style={styles.copyrightText}>
              Desarrollado por CarpinchoGames©
            </Text>
            
            <Button
              title="Cerrar"
              onPress={() => setShowAboutModal(false)}
              style={styles.comingSoonButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  editProfileButton: {
    marginTop: 8,
  },
  editProfileText: {
    color: colors.secondary,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  disabledText: {
    color: colors.textSecondaryDark,
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: colors.error,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  inputContainer: {
    marginBottom: 16,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Coming Soon Modal
  comingSoonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonContent: {
    width: '80%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  comingSoonIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    color: colors.textSecondaryDark,
    textAlign: 'center',
    marginBottom: 24,
  },
  copyrightText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  comingSoonButton: {
    minWidth: 120,
  },
});
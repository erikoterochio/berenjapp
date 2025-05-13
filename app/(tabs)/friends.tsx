import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { UserListItem } from '@/components/UserListItem';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/constants/colors';
import { useFriendsStore } from '@/store/friends-store';
import { Users, UserPlus, UserCheck, UserX, Search } from 'lucide-react-native';

export default function FriendsScreen() {
  const { 
    friends, 
    incomingRequests, 
    fetchFriends, 
    fetchRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    isLoading,
    error
  } = useFriendsStore();
  
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('friends');
  
  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);
  
  const handleSendRequest = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre de usuario');
      return;
    }
    
    try {
      await sendFriendRequest(username);
      setUsername('');
      Alert.alert('Éxito', 'Solicitud de amistad enviada correctamente');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al enviar solicitud');
    }
  };
  
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Éxito', 'Solicitud de amistad aceptada');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al aceptar solicitud');
    }
  };
  
  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al rechazar solicitud');
    }
  };
  
  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Eliminar Amigo',
      `¿Estás seguro que deseas eliminar a ${friendName} de tus amigos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Error al eliminar amigo');
            }
          }
        }
      ]
    );
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <>
            <View style={styles.searchContainer}>
              <Input
                placeholder="Buscar amigos por nombre de usuario"
                value={username}
                onChangeText={setUsername}
                leftIcon={<Search size={20} color={colors.textSecondaryDark} />}
                containerStyle={styles.searchInput}
              />
              <Button
                title="Añadir"
                onPress={handleSendRequest}
                variant="primary"
                size="small"
                loading={isLoading}
                icon={<UserPlus size={16} color="white" />}
              />
            </View>
            
            {friends.length > 0 ? (
              friends.map(friend => (
                <UserListItem
                  key={friend.id}
                  user={friend.user}
                  subtitle={`Amigos desde ${new Date(friend.since).toLocaleDateString()}`}
                  rightElement={
                    <Button
                      title="Eliminar"
                      onPress={() => handleRemoveFriend(friend.id, friend.user.username)}
                      variant="outline"
                      size="small"
                      style={styles.removeButton}
                      textStyle={styles.removeButtonText}
                    />
                  }
                />
              ))
            ) : (
              <EmptyState
                title="No tienes amigos aún"
                description="Añade amigos para jugar a las cartas juntos"
                icon={<Users size={48} color={colors.textSecondary} />}
              />
            )}
          </>
        );
        
      case 'requests':
        return (
          <>
            {incomingRequests.length > 0 ? (
              incomingRequests.map(request => (
                <UserListItem
                  key={request.id}
                  user={request.from}
                  subtitle={`Enviada el ${new Date(request.createdAt).toLocaleDateString()}`}
                  rightElement={
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptRequest(request.id)}
                      >
                        <UserCheck size={20} color={colors.success} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectRequest(request.id)}
                      >
                        <UserX size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  }
                />
              ))
            ) : (
              <EmptyState
                title="No hay solicitudes de amistad"
                description="Cuando alguien te envíe una solicitud de amistad, aparecerá aquí"
                icon={<UserPlus size={48} color={colors.textSecondary} />}
              />
            )}
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Amigos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Solicitudes
            </Text>
            
            {incomingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{incomingRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  activeTabText: {
    color: 'white',
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success + '20',
  },
  rejectButton: {
    backgroundColor: colors.error + '20',
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  removeButton: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10', // Light red background
  },
  removeButtonText: {
    color: colors.error,
  },
});
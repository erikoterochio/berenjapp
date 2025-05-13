import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { UserListItem } from '@/components/UserListItem';
import { NumberStepper } from '@/components/NumberStepper';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useFriendsStore } from '@/store/friends-store';
import { useMatchesStore } from '@/store/matches-store';
import { Users, Check, X, Trophy } from 'lucide-react-native';

export default function NewMatchScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { friends } = useFriendsStore();
  const { createMatch, isLoading } = useMatchesStore();
  
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [winningPoints, setWinningPoints] = useState(50);
  
  if (!user) return null;
  
  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };
  
  const handleCreateMatch = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Por favor selecciona al menos un amigo para jugar');
      return;
    }
    
    try {
      // Include current user and selected friends
      const playerIds = [user.id, ...selectedFriends];
      const match = await createMatch(playerIds, winningPoints);
      
      // Navigate to the match screen
      router.push(`/match/${match.id}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al crear partida');
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Crear Nueva Partida</Text>
        <Text style={styles.subtitle}>Selecciona amigos para jugar</Text>
        
        <Card title="Configuración de Partida">
          <View style={styles.settingContainer}>
            <View style={styles.settingHeader}>
              <Trophy size={20} color={colors.primary} />
              <Text style={styles.settingTitle}>Puntos para Ganar</Text>
            </View>
            <Text style={styles.settingDescription}>
              Los jugadores ganan cuando alcanzan esta cantidad de puntos
            </Text>
            <NumberStepper
              value={winningPoints}
              onChange={setWinningPoints}
              min={10}
              max={100}
              step={5}
            />
          </View>
        </Card>
        
        <Card title={`Amigos Seleccionados (${selectedFriends.length})`}>
          {friends.length > 0 ? (
            friends.map(friend => (
              <UserListItem
                key={friend.id}
                user={friend.user}
                onPress={() => toggleFriendSelection(friend.user.id)}
                rightElement={
                  <View style={[
                    styles.selectionIndicator,
                    selectedFriends.includes(friend.user.id) && styles.selectedIndicator
                  ]}>
                    {selectedFriends.includes(friend.user.id) ? (
                      <Check size={16} color="white" />
                    ) : (
                      <X size={16} color={colors.textSecondary} />
                    )}
                  </View>
                }
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              Necesitas añadir amigos antes de crear una partida
            </Text>
          )}
        </Card>
        
        <View style={styles.infoCard}>
          <Users size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Serás añadido automáticamente a la partida como jugador
          </Text>
        </View>
        
        <Button
          title="Crear Partida"
          onPress={handleCreateMatch}
          loading={isLoading}
          disabled={friends.length === 0 || selectedFriends.length === 0}
          style={styles.createButton}
        />
      </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  settingContainer: {
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondaryDark,
    marginBottom: 12,
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  selectedIndicator: {
    backgroundColor: colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: 'white',
    fontSize: 14,
  },
  createButton: {
    marginBottom: 16,
  },
  emptyText: {
    color: colors.text,
    textAlign: 'center',
    padding: 16,
  },
});
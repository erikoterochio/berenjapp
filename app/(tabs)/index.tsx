import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/constants/colors';
import { useMatchesStore } from '@/store/matches-store';
import { useAuthStore } from '@/store/auth-store';
import { Plus, Users, Award, Clock } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { matches } = useMatchesStore();
  
  // Filter active matches where the user is a player
  const activeMatches = matches.filter(
    match => match.isActive && match.players.includes(user?.id || '')
  );
  
  // Get the most recent completed matches
  const recentMatches = matches
    .filter(match => !match.isActive && match.players.includes(user?.id || ''))
    .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
    .slice(0, 3);
  
  const navigateToNewMatch = () => {
    router.push('/match/new');
  };
  
  const navigateToMatch = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };
  
  const renderMatchItem = (match: any, isActive: boolean) => {
    const date = new Date(isActive ? match.createdAt : match.completedAt || match.createdAt);
    const formattedDate = date.toLocaleDateString();
    
    return (
      <TouchableOpacity
        key={match.id}
        style={styles.matchItem}
        onPress={() => navigateToMatch(match.id)}
        activeOpacity={0.7}
      >
        <View style={styles.matchHeader}>
          <View style={styles.matchInfo}>
            <Text style={styles.matchTitle}>
              {isActive ? 'Partida Activa' : 'Partida Completada'}
            </Text>
            <Text style={styles.matchDate}>{formattedDate}</Text>
          </View>
          
          <View style={[
            styles.matchStatus,
            { backgroundColor: isActive ? colors.info : colors.success }
          ]}>
            <Text style={styles.matchStatusText}>
              {isActive ? 'En Progreso' : 'Completada'}
            </Text>
          </View>
        </View>
        
        <View style={styles.matchDetails}>
          <View style={styles.matchDetail}>
            <Users size={16} color={colors.textSecondaryDark} />
            <Text style={styles.matchDetailText}>
              {match.players.length} Jugadores
            </Text>
          </View>
          
          <View style={styles.matchDetail}>
            <Clock size={16} color={colors.textSecondaryDark} />
            <Text style={styles.matchDetailText}>
              {match.rounds.length} Rondas
            </Text>
          </View>
          
          {!isActive && match.winner && (
            <View style={styles.matchDetail}>
              <Award size={16} color={colors.secondary} />
              <Text style={[styles.matchDetailText, { color: colors.secondary }]}>
                {match.winner === user?.id ? '¡Ganaste!' : 'Jugaste'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Hola, {user?.username || 'Jugador'}!</Text>
          <Text style={styles.subtitle}>¿Listo para jugar a las cartas?</Text>
        </View>
        
        <Button
          title="Crear Nueva Partida"
          onPress={navigateToNewMatch}
          icon={<Plus size={20} color="white" />}
          style={styles.newMatchButton}
        />
        
        <Card title="Partidas Activas">
          {activeMatches.length > 0 ? (
            activeMatches.map(match => renderMatchItem(match, true))
          ) : (
            <Text style={styles.emptyText}>No hay partidas activas</Text>
          )}
        </Card>
        
        <Card title="Partidas Recientes">
          {recentMatches.length > 0 ? (
            recentMatches.map(match => renderMatchItem(match, false))
          ) : (
            <Text style={styles.emptyText}>No hay partidas recientes</Text>
          )}
        </Card>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  newMatchButton: {
    marginBottom: 24,
  },
  matchItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  matchDate: {
    fontSize: 14,
    color: colors.textSecondaryDark,
    marginTop: 2,
  },
  matchStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  matchStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  matchDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  matchDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchDetailText: {
    fontSize: 14,
    color: colors.textSecondaryDark,
  },
  emptyText: {
    color: colors.textSecondaryDark,
    textAlign: 'center',
    padding: 16,
  },
});
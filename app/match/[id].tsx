import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { NumberStepper } from '@/components/NumberStepper';
import { UserListItem } from '@/components/UserListItem';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useMatchesStore } from '@/store/matches-store';
import { useFriendsStore } from '@/store/friends-store';
import { Round } from '@/types';
import { 
  Award, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Users, 
  Trophy,
  X,
  AlertCircle,
  Car,
  UserPlus,
  Trash2,
  Check
} from 'lucide-react-native';

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { matches, addRound, updateRoundResults, completeMatch, cancelMatch, addPlayerToMatch, isLoading, error } = useMatchesStore();
  const { friends } = useFriendsStore();
  
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('rounds');
  
  // New round data
  const [cardsPerPlayer, setCardsPerPlayer] = useState(1);
  const [predictions, setPredictions] = useState<{ [userId: string]: number }>({});
  const [results, setResults] = useState<{ [userId: string]: number }>({});
  
  // Add player data
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  
  // Find the match by ID
  const match = matches.find(m => m.id === id);
  
  useEffect(() => {
    // Reset predictions and results when match changes
    if (match) {
      const initialPredictions: { [userId: string]: number } = {};
      const initialResults: { [userId: string]: number } = {};
      
      // Only include active players (those who haven't reached winning points yet)
      const activePlayers = match.players.filter(playerId => !match.losers.includes(playerId));
      
      activePlayers.forEach(playerId => {
        initialPredictions[playerId] = 0;
        initialResults[playerId] = 0;
      });
      
      setPredictions(initialPredictions);
      setResults(initialResults);
    }
  }, [match?.id, match?.losers.length]);
  
  // Auto-expand the most recent round
  useEffect(() => {
    if (match && match.rounds.length > 0) {
      setExpandedRound(match.rounds[match.rounds.length - 1].id);
    }
  }, [match?.rounds.length]);
  
  if (!match || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Partida no encontrada</Text>
      </View>
    );
  }
  
  // Get player usernames (in a real app, we would fetch user details)
  const getPlayerName = (playerId: string) => {
    if (playerId === user.id) return user.username;
    
    // For demo purposes, map player IDs to names
    const playerMap: { [key: string]: string } = {
      '2': 'amigo1',
      '3': 'amigo2',
      '4': 'amigo3'
    };
    
    return playerMap[playerId] || `Jugador ${playerId.slice(-1)}`;
  };
  
  const toggleRoundExpansion = (roundId: string) => {
    if (expandedRound === roundId) {
      setExpandedRound(null);
    } else {
      setExpandedRound(roundId);
    }
  };
  
  const openAddRoundModal = () => {
    // Reset cards per player to a sensible default based on round number
    // In many card games, the number of cards changes each round
    const roundNumber = match.rounds.length;
    const defaultCards = Math.min(10, roundNumber + 1);
    setCardsPerPlayer(defaultCards);
    
    // Reset predictions
    const initialPredictions: { [userId: string]: number } = {};
    
    // Only include active players (those who haven't reached winning points yet)
    const activePlayers = match.players.filter(playerId => !match.losers.includes(playerId));
    
    activePlayers.forEach(playerId => {
      initialPredictions[playerId] = 0;
    });
    setPredictions(initialPredictions);
    
    setShowAddRoundModal(true);
  };
  
  const openResultsModal = (roundIndex: number) => {
    const round = match.rounds[roundIndex];
    
    // Initialize results with zeros
    const initialResults: { [userId: string]: number } = {};
    
    // Only include players who made predictions in this round
    Object.keys(round.playerPredictions).forEach(playerId => {
      initialResults[playerId] = 0;
    });
    
    setResults(initialResults);
    setCurrentRoundIndex(roundIndex);
    setShowResultsModal(true);
  };
  
  const openAddPlayerModal = () => {
    setSelectedFriendId(null);
    setShowAddPlayerModal(true);
  };
  
  const handleAddRound = async () => {
    try {
      // Get active players (those who haven't reached winning points yet)
      const activePlayers = match.players.filter(playerId => !match.losers.includes(playerId));
      
      // Check if all active players have made predictions
      const allPlayersHavePredictions = activePlayers.every(
        playerId => predictions[playerId] !== undefined
      );
      
      if (!allPlayersHavePredictions) {
        Alert.alert('Error', 'Todos los jugadores activos deben hacer predicciones');
        return;
      }
      
      // Check the rule that total predictions can't equal the number of hands (cards per player)
      const totalPredictions = Object.values(predictions).reduce((sum, pred) => sum + pred, 0);
      
      if (totalPredictions === cardsPerPlayer) {
        Alert.alert(
          'Predicciones Inválidas',
          `El total de predicciones (${totalPredictions}) no puede ser igual al número de manos (${cardsPerPlayer})`
        );
        return;
      }
      
      await addRound(match.id, cardsPerPlayer, predictions);
      setShowAddRoundModal(false);
      
      // Automatically open the results modal for the new round
      setTimeout(() => {
        openResultsModal(match.rounds.length - 1);
      }, 500);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al añadir ronda');
    }
  };
  
  const handleUpdateRoundResults = async () => {
    try {
      const round = match.rounds[currentRoundIndex];
      
      // Check if all players who made predictions have results
      const allPlayersHaveResults = Object.keys(round.playerPredictions).every(
        playerId => results[playerId] !== undefined
      );
      
      if (!allPlayersHaveResults) {
        Alert.alert('Error', 'Todos los jugadores deben tener resultados');
        return;
      }
      
      // Check that total results equal the number of hands (cards per player)
      const totalResults = Object.values(results).reduce((sum, res) => sum + res, 0);
      
      if (totalResults !== round.cardsPerPlayer) {
        Alert.alert(
          'Resultados Inválidos',
          `El total de resultados (${totalResults}) debe ser igual al número de manos (${round.cardsPerPlayer})`
        );
        return;
      }
      
      await updateRoundResults(match.id, currentRoundIndex, results);
      setShowResultsModal(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al actualizar resultados');
    }
  };
  
  const handleCompleteMatch = async () => {
    Alert.alert(
      'Finalizar Partida',
      '¿Estás seguro que deseas finalizar esta partida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Finalizar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await completeMatch(match.id);
              router.push('/');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Error al finalizar partida');
            }
          }
        }
      ]
    );
  };
  
  const handleCancelMatch = async () => {
    Alert.alert(
      'Cancelar Partida',
      '¿Estás seguro que deseas cancelar esta partida? Ningún jugador ganará ni perderá.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMatch(match.id);
              router.push('/');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Error al cancelar partida');
            }
          }
        }
      ]
    );
  };
  
  const handleAddPlayer = async () => {
    if (!selectedFriendId) {
      Alert.alert('Error', 'Por favor selecciona un amigo para añadir');
      return;
    }
    
    try {
      await addPlayerToMatch(match.id, selectedFriendId);
      setShowAddPlayerModal(false);
      Alert.alert('Éxito', 'Jugador añadido a la partida');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al añadir jugador');
    }
  };
  
  // Calculate total scores for each player
  const calculateTotalScores = () => {
    const totalScores: { [userId: string]: number } = {};
    
    match.players.forEach(playerId => {
      totalScores[playerId] = 0;
    });
    
    match.rounds.forEach(round => {
      Object.entries(round.playerScores).forEach(([playerId, score]) => {
        totalScores[playerId] = (totalScores[playerId] || 0) + score;
      });
    });
    
    return totalScores;
  };
  
  const totalScores = calculateTotalScores();
  
  // Get active players (those who haven't reached winning points yet)
  const activePlayers = match.players.filter(playerId => !match.losers.includes(playerId));
  
  // Sort players by their position in the game
  // First the winners (in order they reached winning points)
  // Then active players sorted by score (highest first)
  // Then the ultimate loser (if the game is complete)
  const sortedPlayers = [
    // Winners in order they reached winning points
    ...match.losers.filter(playerId => match.winner === playerId || totalScores[playerId] >= match.winningPoints),
    
    // Active players sorted by score
    ...activePlayers.sort((a, b) => (totalScores[b] || 0) - (totalScores[a] || 0)),
    
    // Ultimate loser (if game is complete and not already included)
    ...(match.losers.length === match.players.length && !match.losers.includes(match.losers[match.losers.length - 1]) 
      ? [match.losers[match.losers.length - 1]] 
      : [])
  ];
  
  // Calculate total predictions for the new round
  const totalPredictions = Object.values(predictions).reduce((sum, pred) => sum + pred, 0);
  
  // Calculate total results for the current round
  const totalResults = Object.values(results).reduce((sum, res) => sum + res, 0);
  const currentRound = currentRoundIndex >= 0 ? match.rounds[currentRoundIndex] : null;
  
  // Check if we have a "fiuuum!" situation (total predictions < hands)
  const hasFiuuum = totalPredictions < cardsPerPlayer;
  
  // Sort rounds in reverse order (latest first)
  const sortedRounds = [...match.rounds].reverse();
  
  // Get player status (winner, active, eliminated)
  const getPlayerStatus = (playerId: string) => {
    if (match.winner === playerId) return 'winner';
    if (match.losers.includes(playerId)) {
      if (playerId === match.losers[match.losers.length - 1] && match.losers.length === match.players.length) {
        return 'loser';
      }
      return 'eliminated';
    }
    return 'active';
  };
  
  // Get available friends to add (not already in the match)
  const availableFriends = friends.filter(friend => 
    !match.players.includes(friend.user.id)
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: match.isCancelled ? 'Partida Cancelada' : (match.isActive ? 'Partida Activa' : 'Partida Completada'),
          headerRight: () => (
            match.isActive && (
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={openAddPlayerModal}
                >
                  <UserPlus size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={handleCancelMatch}
                >
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )
          )
        }} 
      />
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rounds' && styles.activeTab]}
          onPress={() => setActiveTab('rounds')}
        >
          <Text style={[styles.tabText, activeTab === 'rounds' && styles.activeTabText]}>
            Rondas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'points' && styles.activeTab]}
          onPress={() => setActiveTab('points')}
        >
          <Text style={[styles.tabText, activeTab === 'points' && styles.activeTabText]}>
            Puntos
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Card title="Información de la Partida">
          <View style={styles.matchInfo}>
            <View style={styles.matchDetail}>
              <Clock size={16} color={colors.text} />
              <Text style={styles.matchDetailText}>
                Iniciada: {new Date(match.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.matchDetail}>
              <Users size={16} color={colors.text} />
              <Text style={styles.matchDetailText}>
                Jugadores: {match.players.length}
              </Text>
            </View>
            
            <View style={styles.matchDetail}>
              <Trophy size={16} color={colors.text} />
              <Text style={styles.matchDetailText}>
                Puntos para Ganar: {match.winningPoints}
              </Text>
            </View>
            
            {match.completedAt && (
              <View style={styles.matchDetail}>
                <Clock size={16} color={colors.text} />
                <Text style={styles.matchDetailText}>
                  Completada: {new Date(match.completedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            {match.isCancelled && (
              <View style={styles.matchDetail}>
                <Trash2 size={16} color={colors.error} />
                <Text style={[styles.matchDetailText, { color: colors.error }]}>
                  Esta partida fue cancelada
                </Text>
              </View>
            )}
            
            {match.winner && !match.isCancelled && (
              <View style={styles.matchDetail}>
                <Trophy size={16} color={colors.primary} />
                <Text style={[styles.matchDetailText, { color: colors.primary }]}>
                  Ganador: {getPlayerName(match.winner)}
                </Text>
              </View>
            )}
          </View>
        </Card>
        
        {activeTab === 'points' && (
          <Card title="Tabla de Posiciones">
            {sortedPlayers.map((playerId, index) => {
              const playerStatus = getPlayerStatus(playerId);
              const isWinner = playerStatus === 'winner';
              const isLoser = playerStatus === 'loser';
              const isEliminated = playerStatus === 'eliminated';
              const isActive = playerStatus === 'active';
              
              return (
                <View 
                  key={playerId} 
                  style={[
                    styles.leaderboardItem,
                    isEliminated && styles.eliminatedPlayer,
                    isLoser && styles.loserPlayer
                  ]}
                >
                  <View style={[
                    styles.leaderboardRank,
                    isWinner && styles.winnerRank,
                    isLoser && styles.loserRank
                  ]}>
                    <Text style={[
                      styles.rankText,
                      isWinner && styles.winnerRankText,
                      isLoser && styles.loserRankText
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  <View style={styles.leaderboardPlayer}>
                    <Avatar 
                      name={getPlayerName(playerId)} 
                      size={36} 
                    />
                    <Text style={[
                      styles.playerName,
                      isEliminated && styles.eliminatedText,
                      isLoser && styles.loserText
                    ]}>
                      {getPlayerName(playerId)}
                      {playerId === user.id && ' (Tú)'}
                    </Text>
                  </View>
                  
                  <View style={styles.leaderboardScore}>
                    <Text style={[
                      styles.scoreText,
                      isEliminated && styles.eliminatedText,
                      isLoser && styles.loserText
                    ]}>
                      {totalScores[playerId] || 0}
                    </Text>
                    <Text style={[
                      styles.scoreLabel,
                      isEliminated && styles.eliminatedText,
                      isLoser && styles.loserText
                    ]}>
                      puntos
                    </Text>
                  </View>
                  
                  {isWinner && <Trophy size={24} color={colors.primary} />}
                  {isEliminated && !isWinner && !isLoser && (
                    <Text style={styles.eliminatedLabel}>Eliminado</Text>
                  )}
                  {isLoser && <Text style={styles.loserLabel}>Último Lugar</Text>}
                  {isActive && totalScores[playerId] >= match.winningPoints * 0.8 && (
                    <Text style={styles.closeToWinLabel}>¡Cerca!</Text>
                  )}
                </View>
              );
            })}
            
            <View style={styles.winCondition}>
              <Trophy size={20} color={colors.primary} />
              <Text style={styles.winConditionText}>
                Los jugadores ganan cuando alcanzan {match.winningPoints} puntos
              </Text>
            </View>
          </Card>
        )}
        
        {activeTab === 'rounds' && (
          <Card title={`Rondas (${match.rounds.length})`}>
            {sortedRounds.map((round, index) => {
              const originalIndex = match.rounds.length - 1 - index;
              
              // Skip special "joining" rounds that have cardsPerPlayer = 0
              if (round.cardsPerPlayer === 0 && round.id.startsWith('joining-')) {
                return null;
              }
              
              return (
                <View key={round.id} style={styles.roundItem}>
                  <TouchableOpacity 
                    style={styles.roundHeader}
                    onPress={() => toggleRoundExpansion(round.id)}
                  >
                    <Text style={styles.roundTitle}>
                      Ronda {originalIndex + 1} ({round.cardsPerPlayer} cartas/jugador)
                    </Text>
                    
                    {expandedRound === round.id ? (
                      <ChevronUp size={20} color={colors.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  
                  {expandedRound === round.id && (
                    <View style={styles.roundDetails}>
                      <Text style={styles.roundSectionTitle}>Predicciones</Text>
                      {Object.keys(round.playerPredictions).map(playerId => (
                        <View key={`pred-${playerId}`} style={styles.playerPrediction}>
                          <Text style={[
                            styles.playerPredictionName,
                            match.losers.includes(playerId) && styles.eliminatedText
                          ]}>
                            {getPlayerName(playerId)}:
                          </Text>
                          <Text style={styles.playerPredictionValue}>
                            {round.playerPredictions[playerId] || 0}
                          </Text>
                        </View>
                      ))}
                      
                      <Text style={styles.roundSectionTitle}>Resultados</Text>
                      {Object.keys(round.playerResults).length > 0 ? (
                        Object.keys(round.playerPredictions).map(playerId => (
                          <View key={`res-${playerId}`} style={styles.playerPrediction}>
                            <Text style={[
                              styles.playerPredictionName,
                              match.losers.includes(playerId) && styles.eliminatedText
                            ]}>
                              {getPlayerName(playerId)}:
                            </Text>
                            <Text style={styles.playerPredictionValue}>
                              {round.playerResults[playerId] || 0}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.noResults}>
                          <Button
                            title="Ingresar Resultados"
                            onPress={() => openResultsModal(originalIndex)}
                            size="small"
                            loading={isLoading}
                          />
                        </View>
                      )}
                      
                      {Object.keys(round.playerScores).length > 0 && (
                        <>
                          <Text style={styles.roundSectionTitle}>Puntuaciones</Text>
                          {Object.keys(round.playerPredictions).map(playerId => (
                            <View key={`score-${playerId}`} style={styles.playerPrediction}>
                              <Text style={[
                                styles.playerPredictionName,
                                match.losers.includes(playerId) && styles.eliminatedText
                              ]}>
                                {getPlayerName(playerId)}:
                              </Text>
                              <Text style={[
                                styles.playerPredictionValue,
                                round.playerScores[playerId] > 0 && styles.positiveScore
                              ]}>
                                {round.playerScores[playerId] || 0}
                              </Text>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            
            {match.rounds.length === 0 && (
              <Text style={styles.emptyText}>No hay rondas jugadas aún</Text>
            )}
            
            {match.isActive && activePlayers.length > 1 && (
              <Button
                title="Añadir Ronda"
                onPress={openAddRoundModal}
                icon={<Plus size={20} color="white" />}
                style={styles.addRoundButton}
                loading={isLoading}
              />
            )}
          </Card>
        )}
      </ScrollView>
      
      {/* Add Round Modal */}
      <Modal
        visible={showAddRoundModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddRoundModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Nueva Ronda</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddRoundModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <NumberStepper
                label="Cartas por jugador"
                value={cardsPerPlayer}
                onChange={setCardsPerPlayer}
                min={1}
                max={20}
              />
              
              <Text style={styles.sectionTitle}>Predicciones de Jugadores</Text>
              <Text style={styles.sectionSubtitle}>
                ¿Cuántas manos ganará cada jugador?
              </Text>
              
              {activePlayers.map(playerId => (
                <View key={playerId} style={styles.playerInput}>
                  <Text style={styles.playerInputName}>
                    {getPlayerName(playerId)}:
                  </Text>
                  <NumberStepper
                    value={predictions[playerId] || 0}
                    onChange={(value) => {
                      setPredictions({
                        ...predictions,
                        [playerId]: value
                      });
                    }}
                    min={0}
                    max={cardsPerPlayer}
                  />
                </View>
              ))}
              
              <View style={styles.predictionSummary}>
                <Text style={styles.predictionSummaryText}>
                  Total Predicciones: {totalPredictions} / Cartas por jugador: {cardsPerPlayer}
                </Text>
                
                {totalPredictions === cardsPerPlayer && (
                  <View style={styles.warningContainer}>
                    <AlertCircle size={16} color={colors.error} />
                    <Text style={styles.warningText}>
                      El total de predicciones no puede ser igual a las cartas por jugador
                    </Text>
                  </View>
                )}
                
                {hasFiuuum && (
                  <View style={styles.fiuuumContainer}>
                    <Car size={20} color="white" />
                    <Text style={styles.fiuuumText}>
                      ¡Tenemos un fiuuum!
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setShowAddRoundModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Añadir Ronda"
                onPress={handleAddRound}
                disabled={totalPredictions === cardsPerPlayer}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Enter Results Modal */}
      <Modal
        visible={showResultsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ingresar Resultados de Ronda</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowResultsModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Resultados de Jugadores</Text>
              <Text style={styles.sectionSubtitle}>
                ¿Cuántas manos ganó realmente cada jugador?
              </Text>
              
              {currentRound && Object.keys(currentRound.playerPredictions).map(playerId => (
                <View key={playerId} style={styles.playerInput}>
                  <View style={styles.playerInputHeader}>
                    <Text style={styles.playerInputName}>
                      {getPlayerName(playerId)}:
                    </Text>
                    <Text style={styles.playerPrediction}>
                      Predijo: {currentRound.playerPredictions[playerId] || 0}
                    </Text>
                  </View>
                  <NumberStepper
                    value={results[playerId] || 0}
                    onChange={(value) => {
                      setResults({
                        ...results,
                        [playerId]: value
                      });
                    }}
                    min={0}
                    max={currentRound.cardsPerPlayer}
                  />
                </View>
              ))}
              
              <View style={styles.predictionSummary}>
                <Text style={styles.predictionSummaryText}>
                  Total Resultados: {totalResults} / Cartas por jugador: {currentRound?.cardsPerPlayer || 0}
                </Text>
                
                {currentRound && totalResults !== currentRound.cardsPerPlayer && (
                  <View style={styles.warningContainer}>
                    <AlertCircle size={16} color={colors.error} />
                    <Text style={styles.warningText}>
                      El total de resultados debe ser igual a las cartas por jugador
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setShowResultsModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Guardar Resultados"
                onPress={handleUpdateRoundResults}
                disabled={!currentRound || totalResults !== currentRound.cardsPerPlayer}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Add Player Modal */}
      <Modal
        visible={showAddPlayerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddPlayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Jugador a la Partida</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddPlayerModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Seleccionar Amigo</Text>
              <Text style={styles.sectionSubtitle}>
                El nuevo jugador comenzará con la puntuación del jugador activo más bajo
              </Text>
              
              {availableFriends.length > 0 ? (
                availableFriends.map(friend => (
                  <UserListItem
                    key={friend.id}
                    user={friend.user}
                    onPress={() => setSelectedFriendId(friend.user.id)}
                    rightElement={
                      <View style={[
                        styles.selectionIndicator,
                        selectedFriendId === friend.user.id && styles.selectedIndicator
                      ]}>
                        {selectedFriendId === friend.user.id ? (
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
                  No hay amigos disponibles para añadir
                </Text>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setShowAddPlayerModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Añadir Jugador"
                onPress={handleAddPlayer}
                disabled={!selectedFriendId || availableFriends.length === 0}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
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
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  activeTabText: {
    color: 'white',
  },
  matchInfo: {
    gap: 8,
  },
  matchDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchDetailText: {
    fontSize: 14,
    color: colors.text,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eliminatedPlayer: {
    opacity: 0.7,
  },
  loserPlayer: {
    backgroundColor: colors.error + '10',
  },
  leaderboardRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  winnerRank: {
    backgroundColor: colors.primary,
  },
  loserRank: {
    backgroundColor: colors.error + '20',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  winnerRankText: {
    color: 'white',
  },
  loserRankText: {
    color: colors.error,
  },
  leaderboardPlayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    color: colors.text,
  },
  eliminatedText: {
    color: colors.textSecondaryDark,
    textDecorationLine: 'line-through',
  },
  loserText: {
    color: colors.error,
  },
  leaderboardScore: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.textSecondaryDark,
  },
  eliminatedLabel: {
    fontSize: 12,
    color: colors.textSecondaryDark,
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loserLabel: {
    fontSize: 12,
    color: 'white',
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closeToWinLabel: {
    fontSize: 12,
    color: 'white',
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  winCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    backgroundColor: colors.primary + '10',
    padding: 8,
    borderRadius: 8,
  },
  winConditionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  roundItem: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  roundDetails: {
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  roundSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  playerPrediction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  playerPredictionName: {
    fontSize: 14,
    color: colors.text,
  },
  playerPredictionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  positiveScore: {
    color: colors.success,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  addRoundButton: {
    marginTop: 8,
  },
  emptyText: {
    color: colors.text,
    textAlign: 'center',
    padding: 16,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
    marginBottom: 8,
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
    maxHeight: '70%',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondaryDark,
    marginBottom: 16,
  },
  playerInput: {
    marginBottom: 16,
  },
  playerInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerInputName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  playerPrediction: {
    fontSize: 14,
    color: colors.textSecondaryDark,
  },
  predictionSummary: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  predictionSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.error,
  },
  fiuuumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  fiuuumText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
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
});
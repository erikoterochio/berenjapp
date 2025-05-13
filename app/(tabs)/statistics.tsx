import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useStatsStore } from '@/store/stats-store';
import { useFriendsStore } from '@/store/friends-store';
import { Award, Frown, Users, TrendingUp, Target, Trophy, ChevronDown, ChevronUp } from 'lucide-react-native';
import { UserStats } from '@/types';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

export default function StatisticsScreen() {
  const { user } = useAuthStore();
  const { getUserStats, getFriendStats } = useStatsStore();
  const { friends } = useFriendsStore();
  
  const [activeTab, setActiveTab] = useState('user');
  const [sortColumn, setSortColumn] = useState('matchesWon');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  if (!user) return null;
  
  const userStats = getUserStats(user.id);
  const friendStats = getFriendStats();
  
  const mostWinningFriend = friends.find(f => f.user.id === friendStats.mostWins);
  const mostLosingFriend = friends.find(f => f.user.id === friendStats.mostLosses);
  
  // Get stats for all friends and current user
  const allPlayersStats = [
    { player: user, stats: userStats, isCurrentUser: true },
    ...friends.map(friend => ({
      player: friend.user,
      stats: getUserStats(friend.user.id),
      isCurrentUser: false
    }))
  ];
  
  // Sort players by the selected column
  const sortedPlayersStats = [...allPlayersStats].sort((a, b) => {
    const valueA = a.stats[sortColumn as keyof UserStats];
    const valueB = b.stats[sortColumn as keyof UserStats];
    
    if (sortDirection === 'asc') {
      return Number(valueA) - Number(valueB);
    } else {
      return Number(valueB) - Number(valueA);
    }
  });
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color = colors.text }) => (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
  
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp size={16} color={colors.primary} /> 
      : <ChevronDown size={16} color={colors.primary} />;
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'user' && styles.activeTab]}
          onPress={() => setActiveTab('user')}
        >
          <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>
            Info Usuario
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Amigos
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'user' && (
          <>
            <Text style={styles.title}>Tus Estadísticas</Text>
            
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <StatItem
                  icon={<Trophy size={24} color={colors.primary} />}
                  label="Partidas Ganadas"
                  value={userStats.matchesWon}
                  color={colors.primary}
                />
              </Card>
              
              <Card style={styles.statCard}>
                <StatItem
                  icon={<Frown size={24} color={colors.error} />}
                  label="Partidas Perdidas"
                  value={userStats.matchesLost}
                  color={colors.error}
                />
              </Card>
              
              <Card style={styles.statCard}>
                <StatItem
                  icon={<Users size={24} color={colors.info} />}
                  label="Partidas Jugadas"
                  value={userStats.matchesPlayed}
                  color={colors.info}
                />
              </Card>
              
              <Card style={styles.statCard}>
                <StatItem
                  icon={<Target size={24} color={colors.info} />}
                  label="Rondas Finales"
                  value={userStats.finalRoundsPlayed}
                  color={colors.info}
                />
              </Card>
            </View>
            
            <Card title="Rendimiento">
              <View style={styles.performanceStats}>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceLabel}>Posición Promedio</Text>
                  <Text style={styles.performanceValue}>
                    {userStats.averagePosition.toFixed(1)}
                  </Text>
                </View>
                
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceLabel}>Puntos Totales</Text>
                  <Text style={styles.performanceValue}>
                    {userStats.totalPoints}
                  </Text>
                </View>
                
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceLabel}>Tasa de Victoria</Text>
                  <Text style={styles.performanceValue}>
                    {userStats.matchesPlayed > 0
                      ? `${((userStats.matchesWon / userStats.matchesPlayed) * 100).toFixed(0)}%`
                      : '0%'}
                  </Text>
                </View>
              </View>
            </Card>
            
            <Card title="Estadísticas de Amigos">
              {friends.length > 0 ? (
                <View style={styles.friendStats}>
                  {mostWinningFriend && (
                    <View style={styles.friendStat}>
                      <Award size={24} color={colors.primary} />
                      <Text style={styles.friendStatLabel}>Más Victorias</Text>
                      <Text style={styles.friendStatValue}>{mostWinningFriend.user.username}</Text>
                    </View>
                  )}
                  
                  {mostLosingFriend && (
                    <View style={styles.friendStat}>
                      <Frown size={24} color={colors.error} />
                      <Text style={styles.friendStatLabel}>Más Derrotas</Text>
                      <Text style={styles.friendStatValue}>{mostLosingFriend.user.username}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.emptyText}>Añade amigos para ver estadísticas</Text>
              )}
            </Card>
          </>
        )}
        
        {activeTab === 'friends' && (
          <>
            <Text style={styles.title}>Comparación de Jugadores</Text>
            
            <Card>
              <View style={styles.tableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                      <TouchableOpacity 
                        style={[styles.tableHeaderCell, styles.playerNameCell]}
                        onPress={() => {/* Sort by name not implemented */}}
                      >
                        <Text style={styles.tableHeaderText}>Jugador</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.tableHeaderCell}
                        onPress={() => handleSort('matchesPlayed')}
                      >
                        <View style={styles.headerContent}>
                          <Text style={styles.tableHeaderText}>Jugadas</Text>
                          {renderSortIcon('matchesPlayed')}
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.tableHeaderCell}
                        onPress={() => handleSort('matchesWon')}
                      >
                        <View style={styles.headerContent}>
                          <Text style={styles.tableHeaderText}>Ganadas</Text>
                          {renderSortIcon('matchesWon')}
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.tableHeaderCell}
                        onPress={() => handleSort('matchesLost')}
                      >
                        <View style={styles.headerContent}>
                          <Text style={styles.tableHeaderText}>Perdidas</Text>
                          {renderSortIcon('matchesLost')}
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.tableHeaderCell}
                        onPress={() => handleSort('finalRoundsPlayed')}
                      >
                        <View style={styles.headerContent}>
                          <Text style={styles.tableHeaderText}>Finales</Text>
                          {renderSortIcon('finalRoundsPlayed')}
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.tableHeaderCell}
                        onPress={() => handleSort('totalPoints')}
                      >
                        <View style={styles.headerContent}>
                          <Text style={styles.tableHeaderText}>Puntos</Text>
                          {renderSortIcon('totalPoints')}
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.tableHeaderCell}
                        onPress={() => handleSort('averagePosition')}
                      >
                        <View style={styles.headerContent}>
                          <Text style={styles.tableHeaderText}>Pos Prom</Text>
                          {renderSortIcon('averagePosition')}
                        </View>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Table Rows */}
                    {sortedPlayersStats.map((item, index) => (
                      <View 
                        key={item.player.id} 
                        style={[
                          styles.tableRow, 
                          item.isCurrentUser ? styles.currentUserRow : (index % 2 === 0 ? styles.evenRow : null)
                        ]}
                      >
                        <View style={[styles.tableCell, styles.playerNameCell]}>
                          <Text 
                            style={[
                              styles.tableCellText, 
                              item.isCurrentUser && styles.currentUserText
                            ]} 
                            numberOfLines={1}
                          >
                            {item.player.username}
                            {item.isCurrentUser && ' (Tú)'}
                          </Text>
                        </View>
                        
                        <View style={styles.tableCell}>
                          <Text style={[
                            styles.tableCellText, 
                            item.isCurrentUser && styles.currentUserText
                          ]}>
                            {item.stats.matchesPlayed}
                          </Text>
                        </View>
                        
                        <View style={styles.tableCell}>
                          <Text style={[
                            styles.tableCellText, 
                            item.isCurrentUser && styles.currentUserText
                          ]}>
                            {item.stats.matchesWon}
                          </Text>
                        </View>
                        
                        <View style={styles.tableCell}>
                          <Text style={[
                            styles.tableCellText, 
                            item.isCurrentUser && styles.currentUserText
                          ]}>
                            {item.stats.matchesLost}
                          </Text>
                        </View>
                        
                        <View style={styles.tableCell}>
                          <Text style={[
                            styles.tableCellText, 
                            item.isCurrentUser && styles.currentUserText
                          ]}>
                            {item.stats.finalRoundsPlayed}
                          </Text>
                        </View>
                        
                        <View style={styles.tableCell}>
                          <Text style={[
                            styles.tableCellText, 
                            item.isCurrentUser && styles.currentUserText
                          ]}>
                            {item.stats.totalPoints}
                          </Text>
                        </View>
                        
                        <View style={styles.tableCell}>
                          <Text style={[
                            styles.tableCellText, 
                            item.isCurrentUser && styles.currentUserText
                          ]}>
                            {item.stats.averagePosition.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    
                    {sortedPlayersStats.length === 0 && (
                      <View style={styles.emptyTableRow}>
                        <Text style={styles.emptyText}>
                          Añade amigos para ver comparación
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            </Card>
            
            <View style={styles.tableInfo}>
              <Text style={styles.tableInfoText}>
                Toca en los encabezados de columna para ordenar la tabla
              </Text>
            </View>
          </>
        )}
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
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondaryDark,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  performanceStat: {
    padding: 12,
    alignItems: 'center',
    minWidth: '30%',
  },
  performanceLabel: {
    fontSize: 14,
    color: colors.textSecondaryDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  friendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  friendStat: {
    padding: 16,
    alignItems: 'center',
    minWidth: '45%',
  },
  friendStatLabel: {
    fontSize: 14,
    color: colors.textSecondaryDark,
    marginTop: 8,
    marginBottom: 4,
  },
  friendStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondaryDark,
    textAlign: 'center',
    padding: 16,
  },
  
  // Table styles
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    paddingVertical: 12,
  },
  tableHeaderCell: {
    paddingHorizontal: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 14,
  },
  playerNameCell: {
    minWidth: 120,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  currentUserRow: {
    backgroundColor: colors.primary + '10',
  },
  currentUserText: {
    fontWeight: '600',
    color: colors.primary,
  },
  evenRow: {
    backgroundColor: colors.background,
  },
  tableCell: {
    paddingHorizontal: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: colors.text,
  },
  emptyTableRow: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  tableInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  tableInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
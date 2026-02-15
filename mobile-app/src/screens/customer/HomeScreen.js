import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchRecentTasks, fetchTaskStats } from '../../store/slices/taskSlice';
import { fetchUserProfile } from '../../store/slices/userSlice';
import TaskCard from '../../components/TaskCard';
import LoadingOverlay from '../../components/LoadingOverlay';

const CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing', icon: 'water', color: '#007AFF' },
  { id: 'electrical', name: 'Electrical', icon: 'flash', color: '#FF9500' },
  { id: 'carpentry', name: 'Carpentry', icon: 'hammer', color: '#8E8E93' },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles', color: '#34C759' },
  { id: 'painting', name: 'Painting', icon: 'color-palette', color: '#FF3B30' },
  { id: 'appliance', name: 'Appliance', icon: 'tv', color: '#5856D6' },
  { id: 'moving', name: 'Moving', icon: 'cube', color: '#FF2D55' },
  { id: 'gardening', name: 'Gardening', icon: 'leaf', color: '#32ADE6' },
];

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user);
  const { recentTasks, stats, loading } = useSelector((state) => state.task);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    dispatch(fetchUserProfile());
    dispatch(fetchRecentTasks());
    dispatch(fetchTaskStats());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateTask = (categoryId = null) => {
    navigation.navigate('TaskFlow', {
      screen: 'CreateTask',
      params: { preselectedCategory: categoryId },
    });
  };

  const handleViewTask = (task) => {
    navigation.navigate('TaskFlow', {
      screen: 'TaskDetail',
      params: { taskId: task.id },
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {profile?.firstName || user?.firstName || t('home.guest')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => Alert.alert(t('common.comingSoon'), t('home.notificationsComingSoon'))}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.urgentTaskButton}
            onPress={() => handleCreateTask()}
            accessibilityLabel={t('home.createUrgentTask')}
          >
            <View style={styles.urgentIconContainer}>
              <Ionicons name="alert-circle" size={32} color="#fff" />
            </View>
            <View style={styles.urgentTextContainer}>
              <Text style={styles.urgentTitle}>{t('home.needHelpNow')}</Text>
              <Text style={styles.urgentSubtitle}>{t('home.getHelpInMinutes')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.completed || 0}</Text>
            <Text style={styles.statLabel}>{t('home.tasksCompleted')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.active || 0}</Text>
            <Text style={styles.statLabel}>{t('home.activeTasks')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.saved || '₹0'}</Text>
            <Text style={styles.statLabel}>{t('home.savedWithUs')}</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => handleCreateTask(category.id)}
                accessibilityLabel={category.name}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                  <Ionicons name={category.icon} size={24} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Tasks */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.recentTasks')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {recentTasks?.length > 0 ? (
            recentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => handleViewTask(task)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>{t('home.noTasksYet')}</Text>
              <TouchableOpacity
                style={styles.createFirstTaskButton}
                onPress={() => handleCreateTask()}
              >
                <Text style={styles.createFirstTaskText}>{t('home.createFirstTask')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <LoadingOverlay visible={loading && !refreshing} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  urgentTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  urgentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  urgentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  urgentSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  createFirstTaskButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  createFirstTaskText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;

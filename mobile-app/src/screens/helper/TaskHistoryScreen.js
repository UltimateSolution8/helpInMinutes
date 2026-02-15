import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchHelperTaskHistory, fetchTaskCounts } from '../../store/slices/helperTaskSlice';

const TaskHistoryScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { taskHistory, taskCount, loading } = useSelector((state) => state.helperTask);
  
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { id: 'ALL', label: t('tasks.filter.all') },
    { id: 'COMPLETED', label: t('tasks.filter.completed') },
    { id: 'CANCELLED', label: t('tasks.filter.cancelled') },
  ];

  useEffect(() => {
    loadTasks();
  }, [dispatch, selectedFilter]);

  const loadTasks = () => {
    dispatch(fetchHelperTaskHistory({ status: selectedFilter, page: 0, size: 20 }));
    dispatch(fetchTaskCounts());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#D32F2F';
      case 'IN_PROGRESS':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED':
        return t('tasks.status.completed');
      case 'CANCELLED':
        return t('tasks.status.cancelled');
      case 'IN_PROGRESS':
        return t('tasks.status.inProgress');
      case 'ACCEPTED':
        return t('tasks.status.accepted');
      default:
        return status;
    }
  };

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
    >
      <View style={styles.taskHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.taskDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription} numberOfLines={2}>
        {item.description || 'No description available'}
      </Text>

      <View style={styles.taskFooter}>
        <View style={styles.taskInfo}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.taskInfoText}>
            {item.distance ? `${item.distance.toFixed(1)} km` : 'Location'}
          </Text>
        </View>
        <View style={styles.taskInfo}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.taskInfoText}>
            {item.estimatedDuration || '30'} min
          </Text>
        </View>
        <View style={styles.taskEarnings}>
          <Text style={styles.earningsText}>{formatCurrency(item.amount || item.earnings)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="briefcase-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>{t('tasks.noTasks')}</Text>
      <Text style={styles.emptySubtitle}>{t('tasks.noTasksMessage')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterButton, selectedFilter === filter.id && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[styles.filterButtonText, selectedFilter === filter.id && styles.filterButtonTextActive]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{taskCount.pending || 0}</Text>
          <Text style={styles.statLabel}>{t('tasks.stats.pending')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{taskCount.completed || 0}</Text>
          <Text style={styles.statLabel}>{t('tasks.stats.completed')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{taskCount.cancelled || 0}</Text>
          <Text style={styles.statLabel}>{t('tasks.stats.cancelled')}</Text>
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={taskHistory}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        onEndReached={() => {
          // Load more tasks if needed
        }}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  taskInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  taskEarnings: {
    flex: 1,
    alignItems: 'flex-end',
  },
  earningsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TaskHistoryScreen;

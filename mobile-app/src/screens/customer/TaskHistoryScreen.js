import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { fetchTaskHistory, setFilterStatus } from '../../store/slices/taskSlice';
import TaskCard from '../../components/TaskCard';
import LoadingOverlay from '../../components/LoadingOverlay';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'IN_PROGRESS', label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const TaskHistoryScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { taskHistory, filterStatus, loading, pagination } = useSelector(
    (state) => state.task
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadTasks();
  }, [filterStatus, page]);

  const loadTasks = async () => {
    dispatch(fetchTaskHistory({ status: filterStatus, page, size: 20 }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await loadTasks();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && pagination?.hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleTaskPress = (task) => {
    navigation.navigate('TaskFlow', {
      screen: 'TaskDetail',
      params: { taskId: task.id },
    });
  };

  const handleFilterChange = (filterId) => {
    dispatch(setFilterStatus(filterId));
    setPage(0);
  };

  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterStatus === item.id && styles.filterButtonActive,
      ]}
      onPress={() => handleFilterChange(item.id)}
    >
      <Text
        style={[
          styles.filterText,
          filterStatus === item.id && styles.filterTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>{t('tasks.noTasks')}</Text>
      <Text style={styles.emptyStateSubtitle}>
        {filterStatus === 'ALL'
          ? t('tasks.noTasksDescription')
          : t('tasks.noTasksWithFilter')}
      </Text>
      <TouchableOpacity
        style={styles.createTaskButton}
        onPress={() => navigation.navigate('TaskFlow', { screen: 'CreateTask' })}
      >
        <Text style={styles.createTaskButtonText}>{t('home.createFirstTask')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tasks.myTasks')}</Text>
        <TouchableOpacity
          style={styles.newTaskButton}
          onPress={() => navigation.navigate('TaskFlow', { screen: 'CreateTask' })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      />

      <FlatList
        data={taskHistory}
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={() => handleTaskPress(item)} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ListFooterComponent={
          loading && taskHistory.length > 0 ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingMoreText}>{t('common.loading')}</Text>
            </View>
          ) : null
        }
      />

      <LoadingOverlay visible={loading && taskHistory.length === 0} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  newTaskButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  createTaskButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTaskButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: '#666',
    fontSize: 14,
  },
});

export default TaskHistoryScreen;

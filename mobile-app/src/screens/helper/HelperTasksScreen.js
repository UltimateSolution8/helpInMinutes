import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { fetchHelperTasks, acceptTask, completeTask } from '../../store/slices/taskSlice';

const HelperTasksScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { helperTasks, loading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    try {
      await dispatch(fetchHelperTasks({ status: activeTab })).unwrap();
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleAcceptTask = (taskId) => {
    Alert.alert(
      'Accept Task',
      'Are you sure you want to accept this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await dispatch(acceptTask(taskId)).unwrap();
              Alert.alert('Success', 'Task accepted successfully!');
              navigation.navigate('TaskProgress', { taskId });
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to accept task');
            }
          },
        },
      ]
    );
  };

  const handleViewTask = (task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'ACCEPTED':
        return '#2196F3';
      case 'IN_PROGRESS':
        return '#9C27B0';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity style={styles.taskCard} onPress={() => handleViewTask(item)}>
      <View style={styles.taskHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.taskTime}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>

      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription} numberOfLines={2}>
        {item.description || 'No description provided'}
      </Text>

      <View style={styles.taskDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="pricetag-outline" size={16} color="#007AFF" />
          <Text style={styles.detailText}>{item.category?.name || 'General'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color="#007AFF" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.address || 'Location not specified'}
          </Text>
        </View>
      </View>

      <View style={styles.taskFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Budget</Text>
          <Text style={styles.priceValue}>₹{item.estimatedBudget?.toLocaleString() || '0'}</Text>
        </View>

        {item.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptTask(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
            <Ionicons name="checkmark" size={18} color="#FFF" />
          </TouchableOpacity>
        )}

        {item.status === 'IN_PROGRESS' && (
          <TouchableOpacity
            style={styles.progressButton}
            onPress={() => navigation.navigate('TaskProgress', { taskId: item.id })}
          >
            <Text style={styles.progressButtonText}>View Progress</Text>
            <Ionicons name="arrow-forward" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>No Tasks Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'available'
          ? 'No available tasks in your area at the moment. Check back later!'
          : `No ${activeTab} tasks`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
          onPress={() => setActiveTab('accepted')}
        >
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
            Accepted
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <FlatList
        data={helperTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  filterButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  taskTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  progressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  progressButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HelperTasksScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';

// Import Redux actions
import { fetchTaskDetails, cancelTask } from '../../store/slices/taskSlice';

const TaskDetailScreen = () => {
  const { taskId } = useRoute().params;
  const dispatch = useDispatch();
  const { currentTask, loading, error } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTaskDetails();
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      await dispatch(fetchTaskDetails(taskId)).unwrap();
    } catch (err) {
      console.error('Failed to load task details:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTaskDetails();
    setRefreshing(false);
  };

  const handleCancelTask = () => {
    Alert.alert(
      'Cancel Task',
      'Are you sure you want to cancel this task? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelTask({ taskId, reason: 'User requested cancellation' })).unwrap();
              Alert.alert('Success', 'Task has been cancelled');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleContactHelper = () => {
    if (currentTask?.helper?.phone) {
      Alert.alert(
        'Contact Helper',
        `Would you like to call ${currentTask.helper.firstName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Linking.openURL(`tel:${currentTask.helper.phone}`) },
        ]
      );
    }
  };

  const navigation = useNavigation();

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'ACCEPTED':
        return '#4CAF50';
      case 'IN_PROGRESS':
        return '#2196F3';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading && !currentTask) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading task details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTaskDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentTask) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={64} color="#8E8E93" />
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => {}}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Task Status Card */}
      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentTask.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(currentTask.status)}</Text>
        </View>
        <Text style={styles.taskId}>Task #{currentTask.id?.slice(-8).toUpperCase()}</Text>
        {currentTask.createdAt && (
          <Text style={styles.taskTime}>
            Created {formatDistanceToNow(new Date(currentTask.createdAt), { addSuffix: true })}
          </Text>
        )}
      </View>

      {/* Category & Skill */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="pricetag-outline" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{currentTask.category?.name || 'General'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="build-outline" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Skill</Text>
            <Text style={styles.infoValue}>{currentTask.skill?.name || 'General Labor'}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{currentTask.description || 'No description provided'}</Text>
      </View>

      {/* Location */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={20} color="#007AFF" />
          <Text style={styles.locationText}>{currentTask.address || 'Address not specified'}</Text>
        </View>
        {currentTask.latitude && currentTask.longitude && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              const url = `https://maps.google.com/?q=${currentTask.latitude},${currentTask.longitude}`;
              Linking.openURL(url);
            }}
          >
            <Ionicons name="map-outline" size={16} color="#007AFF" />
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Schedule */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleItem}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.scheduleText}>
              {currentTask.scheduledDate
                ? format(new Date(currentTask.scheduledDate), 'MMM d, yyyy')
                : 'Flexible'}
            </Text>
          </View>
          <View style={styles.scheduleItem}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.scheduleText}>{currentTask.scheduledTime || 'Flexible'}</Text>
          </View>
        </View>
      </View>

      {/* Budget */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Estimated Budget</Text>
          <Text style={styles.budgetValue}>₹{currentTask.estimatedBudget?.toLocaleString() || '0'}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price Type</Text>
          <Text style={styles.priceValue}>
            {currentTask.priceType === 'FIXED' ? 'Fixed Price' : 'Hourly Rate'}
          </Text>
        </View>
      </View>

      {/* Helper (if assigned) */}
      {currentTask.helper && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assigned Helper</Text>
          <View style={styles.helperCard}>
            <View style={styles.helperAvatar}>
              <Text style={styles.helperAvatarText}>
                {currentTask.helper.firstName?.charAt(0) || 'H'}
              </Text>
            </View>
            <View style={styles.helperInfo}>
              <Text style={styles.helperName}>
                {currentTask.helper.firstName} {currentTask.helper.lastName}
              </Text>
              <View style={styles.helperRating}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={styles.helperRatingText}>
                  {currentTask.helper.rating?.toFixed(1) || 'N/A'}
                </Text>
                <Text style={styles.helperTasks}>({currentTask.helper.completedTasks || 0} tasks)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleContactHelper}>
              <Ionicons name="call-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Timeline */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {currentTask.statusHistory && currentTask.statusHistory.length > 0 ? (
          <View style={styles.timeline}>
            {currentTask.statusHistory.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{getStatusLabel(event.status)}</Text>
                  <Text style={styles.timelineTime}>
                    {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noTimeline}>No timeline available</Text>
        )}
      </View>

      {/* Actions */}
      {currentTask.status === 'PENDING' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelTask}>
            <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel Task</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Spacing */}
      <View style={styles.footerSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  menuButton: {
    padding: 4,
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  taskId: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  mapButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#000',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  priceValue: {
    fontSize: 15,
    color: '#000',
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helperAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  helperInfo: {
    flex: 1,
    marginLeft: 12,
  },
  helperName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  helperRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  helperRatingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FFB800',
    fontWeight: '600',
  },
  helperTasks: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 16,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5EA',
    marginLeft: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginLeft: -7,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timelineTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  noTimeline: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 16,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFEBEA',
  },
  cancelButtonText: {
    color: '#FF3B30',
  },
  footerSpacing: {
    height: 40,
  },
});

export default TaskDetailScreen;

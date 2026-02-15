import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

const TaskCard = ({ task, onPress, onAccept }) => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return '#F44336';
      case 'HIGH':
        return '#FF9800';
      case 'MEDIUM':
        return '#FFC107';
      case 'LOW':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{task.status?.replace(/_/g, ' ')}</Text>
        </View>
        {task.priority && (
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {task.title}
      </Text>

      <Text style={styles.description} numberOfLines={2}>
        {task.description || 'No description provided'}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="pricetag-outline" size={14} color="#007AFF" />
          <Text style={styles.detailText}>{task.category?.name || 'General'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="build-outline" size={14} color="#007AFF" />
          <Text style={styles.detailText}>{task.skill?.name || 'General'}</Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color="#8E8E93" />
        <Text style={styles.locationText} numberOfLines={1}>
          {task.address || 'Location not specified'}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Budget</Text>
          <Text style={styles.priceValue}>₹{task.estimatedBudget?.toLocaleString() || '0'}</Text>
        </View>
        <Text style={styles.timeText}>
          {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
        </Text>
      </View>

      {onAccept && task.status === 'PENDING' && (
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptButtonText}>Accept Task</Text>
          <Ionicons name="checkmark-circle" size={18} color="#FFF" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  header: {
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
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 8,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  footer: {
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
    fontSize: 11,
    color: '#8E8E93',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  timeText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});

export default TaskCard;

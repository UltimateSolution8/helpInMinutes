import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { acceptTask, declineTask, clearTaskAlert } from '../store/slices/helperTaskSlice';
import socketService from '../services/socketService';

const { height } = Dimensions.get('window');

const TaskAlertOverlay = ({ task }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isOnline } = useSelector((state) => state.helperAuth);
  
  const [countdown, setCountdown] = useState(30);
  const slideAnim = useRef(new Animated.Value(-height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      pulse.stop();
    };
  }, []);

  const handleAccept = () => {
    if (!isOnline) {
      Alert.alert(t('common.error'), t('helper.task.goOnlineFirst'));
      return;
    }
    dispatch(acceptTask(task.id));
    socketService.emitTaskAccept(task.id);
    dispatch(clearTaskAlert());
  };

  const handleDecline = () => {
    dispatch(declineTask({ taskId: task.id, reason: 'Declined by helper' }));
    socketService.emitTaskDecline(task.id, 'Declined by helper');
    dispatch(clearTaskAlert());
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      dispatch(clearTaskAlert());
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  if (!task) return null;

  return (
    <Modal transparent visible={!!task} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{countdown}s</Text>
            </View>
            <Text style={styles.title}>{t('helper.alert.newTask')}</Text>
          </View>

          {/* Task Info */}
          <View style={styles.taskInfo}>
            <View style={styles.taskTypeBadge}>
              <Text style={styles.taskTypeText}>{task.taskType || 'General'}</Text>
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color="#666" />
              <Text style={styles.infoText}>
                {task.distance ? `${task.distance.toFixed(1)} km away` : 'Near you'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time" size={18} color="#666" />
              <Text style={styles.infoText}>
                {task.estimatedDuration || '30-45'} min
              </Text>
            </View>
          </View>

          {/* Earnings */}
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>{t('helper.alert.earnings')}</Text>
            <Text style={styles.earningsValue}>
              {formatCurrency(task.estimatedEarnings || task.amount)}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
            >
              <Ionicons name="close" size={24} color="#D32F2F" />
              <Text style={styles.declineButtonText}>{t('common.decline')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
            >
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.acceptButtonText}>{t('helper.task.accept')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
  },
  container: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D32F2F',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  taskInfo: {
    marginBottom: 16,
  },
  taskTypeBadge: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  taskTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  taskTitle: {
    fontSize: 18,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginLeft: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default TaskAlertOverlay;

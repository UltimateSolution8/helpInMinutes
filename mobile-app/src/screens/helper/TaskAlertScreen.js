import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { acceptTask, declineTask, clearTaskAlert } from '../../store/slices/helperTaskSlice';
import socketService from '../../services/socketService';

const { height } = Dimensions.get('window');

const TaskAlertScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { taskAlert } = useSelector((state) => state.helperTask);
  const { isOnline } = useSelector((state) => state.helperAuth);
  
  const [countdown, setCountdown] = useState(30);
  const [declineReason, setDeclineReason] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const task = taskAlert || route.params?.task;

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    // Pulse animation for urgency
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
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
          handleTimeout();
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
    navigation.replace('TaskNavigation', { task });
  };

  const handleDecline = () => {
    if (countdown > 5) {
      Alert.alert(
        t('helper.task.declineTitle'),
        t('helper.task.declineConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.decline'),
            style: 'destructive',
            onPress: () => {
              dispatch(declineTask({ taskId: task.id, reason: 'User declined' }));
              socketService.emitTaskDecline(task.id, 'User declined');
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleTimeout = () => {
    dispatch(clearTaskAlert());
    navigation.goBack();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header with Timer */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.timerCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.timerText}>{countdown}</Text>
          </Animated.View>
          <Text style={styles.urgencyText}>{t('helper.task.respondQuickly')}</Text>
        </View>

        {/* Task Details Card */}
        <View style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={styles.taskTypeBadge}>
              <Text style={styles.taskTypeText}>{task?.taskType || 'General'}</Text>
            </View>
            <Text style={styles.taskTime}>{getTimeAgo(task?.createdAt)}</Text>
          </View>

          <Text style={styles.taskTitle}>{task?.title || 'Task Available'}</Text>
          <Text style={styles.taskDescription}>
            {task?.description || 'New task in your area'}
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.infoText}>
              {task?.distance ? `${task.distance.toFixed(1)} km away` : 'Near your location'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.infoText}>
              {task?.estimatedDuration || '30-45'} min
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t('helper.task.earnings')}</Text>
            <Text style={styles.priceValue}>
              {formatCurrency(task?.estimatedEarnings || task?.amount || 0)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
          >
            <Ionicons name="close" size={24} color="#D32F2F" />
            <Text style={styles.declineButtonText}>{t('common.decline')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={styles.acceptButtonText}>{t('helper.task.accept')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: height * 0.7,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D32F2F',
  },
  urgencyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  taskTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  taskTime: {
    fontSize: 12,
    color: '#999',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
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
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  declineButton: {
    backgroundColor: '#FFEBEE',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default TaskAlertScreen;

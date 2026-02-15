import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

import { 
  setMatchingStatus, 
  setMatchedHelper, 
  cancelTaskStart,
  cancelTaskSuccess,
  cancelTaskFailure 
} from '../../store/slices/taskSlice';
import { cancelTask } from '../../services/taskApi';
import socketService from '../../services/socketService';
import HelperCard from '../../components/HelperCard';
import LoadingOverlay from '../../components/LoadingOverlay';

const { width } = Dimensions.get('window');

const TaskMatchingScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { taskId } = route.params || {};
  
  const { matchingStatus, matchedHelper } = useSelector((state) => state.task);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [searchRadius, setSearchRadius] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start searching animation
    startSearchingAnimation();
    
    // Join task room for real-time updates
    if (taskId) {
      socketService.joinTask(taskId);
    }

    // Listen for socket events
    const unsubscribeAssigned = socketService.onTaskAssigned((data) => {
      dispatch(setMatchedHelper(data.helper));
      dispatch(setMatchingStatus('matched'));
      
      // Navigate to tracking after a brief delay
      setTimeout(() => {
        navigation.replace('TaskTracking', { 
          taskId, 
          helperId: data.helper.id,
          helper: data.helper 
        });
      }, 2000);
    });

    const unsubscribeFailed = socketService.onMatchFailed((data) => {
      dispatch(setMatchingStatus('failed'));
      Alert.alert(
        t('task.matchingFailed'),
        t('task.noHelpersAvailable'),
        [
          { 
            text: t('task.tryAgain'), 
            onPress: () => restartMatching() 
          },
          { 
            text: t('task.cancel'), 
            onPress: () => handleCancel(),
            style: 'cancel'
          }
        ]
      );
    });

    // Timer for elapsed time
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Expand search radius every 30 seconds
    const radiusTimer = setInterval(() => {
      setSearchRadius((prev) => Math.min(prev + 1, 10));
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(radiusTimer);
      unsubscribeAssigned?.();
      unsubscribeFailed?.();
      if (taskId) {
        socketService.leaveTask(taskId);
      }
    };
  }, [taskId]);

  const startSearchingAnimation = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation for radar
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };

  const restartMatching = () => {
    dispatch(setMatchingStatus('searching'));
    setElapsedTime(0);
    setSearchRadius(1);
    // Emit restart matching event
    socketService.emit('task:restart_matching', { taskId });
  };

  const handleCancel = async () => {
    Alert.alert(
      t('task.cancelTask'),
      t('task.cancelTaskConfirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            dispatch(cancelTaskStart());
            try {
              await cancelTask(taskId);
              dispatch(cancelTaskSuccess());
              navigation.navigate('CustomerMain', { screen: 'Home' });
            } catch (err) {
              dispatch(cancelTaskFailure(err.message));
              Alert.alert(t('common.error'), err.message);
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('task.findingHelper')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Radar Animation */}
        <View style={styles.radarContainer}>
          <Animated.View
            style={[
              styles.radarCircle,
              styles.radarCircleOuter,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Animated.View
            style={[
              styles.radarCircle,
              styles.radarCircleMiddle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View style={styles.radarCenter}>
            <Animated.View
              style={[
                styles.radarSweep,
                { transform: [{ rotate: spin }] },
              ]}
            />
            <Ionicons name="search" size={40} color="#007AFF" />
          </View>
        </View>

        {/* Status Text */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>
            {matchingStatus === 'searching' && t('task.searchingForHelpers')}
            {matchingStatus === 'matched' && t('task.helperFound')}
            {matchingStatus === 'failed' && t('task.noHelpersFound')}
          </Text>
          <Text style={styles.statusSubtitle}>
            {matchingStatus === 'searching' && 
              t('task.searchingInRadius', { radius: searchRadius })}
            {matchingStatus === 'matched' && 
              t('task.connectingWithHelper')}
            {matchingStatus === 'failed' && 
              t('task.tryExpandingSearch')}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.statLabel}>{t('task.elapsedTime')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{searchRadius} km</Text>
            <Text style={styles.statLabel}>{t('task.searchRadius')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={24} color="#007AFF" />
            <Text style={styles.statValue}>...</Text>
            <Text style={styles.statLabel}>{t('task.helpersNearby')}</Text>
          </View>
        </View>

        {/* Matched Helper Preview */}
        {matchedHelper && (
          <View style={styles.helperPreviewContainer}>
            <Text style={styles.helperPreviewTitle}>{t('task.yourHelper')}</Text>
            <HelperCard helper={matchedHelper} compact />
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.tipsText}>
            {elapsedTime < 30 
              ? t('task.matchingTip1')
              : elapsedTime < 60
              ? t('task.matchingTip2')
              : t('task.matchingTip3')}
          </Text>
        </View>
      </View>

      {/* Cancel Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
          <Text style={styles.cancelButtonText}>{t('task.cancelSearch')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  radarContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#007AFF20',
  },
  radarCircleOuter: {
    width: 200,
    height: 200,
    backgroundColor: '#007AFF05',
  },
  radarCircleMiddle: {
    width: 140,
    height: 140,
    backgroundColor: '#007AFF10',
  },
  radarCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  radarSweep: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    backgroundColor: '#007AFF30',
    borderTopLeftRadius: 40,
    transformOrigin: 'bottom right',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    width: width - 40,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  helperPreviewContainer: {
    width: '100%',
    marginTop: 24,
  },
  helperPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    width: width - 40,
  },
  tipsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TaskMatchingScreen;

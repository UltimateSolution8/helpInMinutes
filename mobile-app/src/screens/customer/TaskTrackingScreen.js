import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

import { 
  updateTaskStatus, 
  setHelperLocation,
  completeTask 
} from '../../store/slices/taskSlice';
import { fetchTaskDetails } from '../../services/taskApi';
import socketService from '../../services/socketService';
import HelperCard from '../../components/HelperCard';
import LoadingOverlay from '../../components/LoadingOverlay';
import { formatDistance, formatDuration } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_APIKEY = 'YOUR_GOOGLE_MAPS_API_KEY';

const TASK_STATUS = {
  ASSIGNED: 'ASSIGNED',
  HELPER_ARRIVING: 'HELPER_ARRIVING',
  HELPER_ARRIVED: 'HELPER_ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

const TaskTrackingScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  
  const { taskId, helperId, helper: initialHelper } = route.params || {};
  const { currentTask, helperLocation, loading } = useSelector((state) => state.task);
  
  const [task, setTask] = useState(null);
  const [helper, setHelper] = useState(initialHelper);
  const [userLocation, setUserLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [status, setStatus] = useState(TASK_STATUS.ASSIGNED);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTaskDetails();
    setupSocketListeners();
    
    return () => {
      socketService.leaveTask(taskId);
    };
  }, [taskId]);

  useEffect(() => {
    // Animate bottom sheet up
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadTaskDetails = async () => {
    try {
      const details = await fetchTaskDetails(taskId);
      setTask(details);
      setStatus(details.status);
      setUserLocation(details.location);
    } catch (err) {
      console.error('Error loading task details:', err);
    }
  };

  const setupSocketListeners = () => {
    socketService.joinTask(taskId);

    // Listen for helper location updates
    socketService.onHelperLocation((data) => {
      if (data.helperId === helperId) {
        dispatch(setHelperLocation(data.location));
        setEta(data.eta);
        setDistance(data.distance);
        
        // Animate map to show both markers
        fitMapToCoordinates(data.location);
      }
    });

    // Listen for status updates
    socketService.onTaskStatusUpdate((data) => {
      setStatus(data.status);
      dispatch(updateTaskStatus({ taskId, status: data.status }));
      
      if (data.status === TASK_STATUS.COMPLETED) {
        navigation.replace('Payment', { taskId });
      }
    });

    // Listen for helper messages
    socketService.onHelperMessage((data) => {
      // Show in-app notification or update chat
    });
  };

  const fitMapToCoordinates = (helperLoc) => {
    if (mapRef.current && userLocation && helperLoc) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: helperLoc.latitude, longitude: helperLoc.longitude },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  };

  const handleCallHelper = () => {
    if (helper?.phone) {
      Linking.openURL(`tel:${helper.phone}`);
    } else {
      Alert.alert(t('common.error'), t('task.helperPhoneNotAvailable'));
    }
  };

  const handleChatWithHelper = () => {
    navigation.navigate('Chat', { 
      taskId, 
      helperId,
      helperName: helper?.name 
    });
  };

  const handleCancelTask = () => {
    Alert.alert(
      t('task.cancelTask'),
      t('task.cancelTaskConfirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              // API call to cancel task
              navigation.navigate('CustomerMain', { screen: 'Home' });
            } catch (err) {
              Alert.alert(t('common.error'), err.message);
            }
          },
        },
      ]
    );
  };

  const handleConfirmCompletion = () => {
    Alert.alert(
      t('task.confirmCompletion'),
      t('task.confirmCompletionMessage'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: () => {
            dispatch(completeTask(taskId));
            navigation.replace('Payment', { taskId });
          },
        },
      ]
    );
  };

  const getStatusMessage = () => {
    switch (status) {
      case TASK_STATUS.ASSIGNED:
        return t('task.helperAssigned');
      case TASK_STATUS.HELPER_ARRIVING:
        return t('task.helperOnTheWay');
      case TASK_STATUS.HELPER_ARRIVED:
        return t('task.helperArrived');
      case TASK_STATUS.IN_PROGRESS:
        return t('task.workInProgress');
      default:
        return t('task.trackingHelper');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case TASK_STATUS.ASSIGNED:
        return '#007AFF';
      case TASK_STATUS.HELPER_ARRIVING:
        return '#FF9500';
      case TASK_STATUS.HELPER_ARRIVED:
        return '#34C759';
      case TASK_STATUS.IN_PROGRESS:
        return '#5856D6';
      default:
        return '#007AFF';
    }
  };

  const bottomSheetTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation?.latitude || 12.9716,
          longitude: userLocation?.longitude || 77.5946,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker coordinate={userLocation}>
            <View style={styles.userMarker}>
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        )}

        {/* Helper Location Marker */}
        {helperLocation && (
          <Marker coordinate={helperLocation}>
            <View style={styles.helperMarker}>
              <Ionicons name="construct" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {userLocation && helperLocation && (
          <MapViewDirections
            origin={helperLocation}
            destination={userLocation}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="#007AFF"
            onReady={(result) => {
              setDistance(result.distance);
              setEta(result.duration);
            }}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleCancelTask}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* ETA Card */}
      {eta && distance && (
        <View style={styles.etaCard}>
          <View style={styles.etaItem}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.etaValue}>{formatDuration(eta)}</Text>
            <Text style={styles.etaLabel}>{t('task.eta')}</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaItem}>
            <Ionicons name="navigate-outline" size={20} color="#007AFF" />
            <Text style={styles.etaValue}>{formatDistance(distance)}</Text>
            <Text style={styles.etaLabel}>{t('task.distance')}</Text>
          </View>
        </View>
      )}

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: bottomSheetTranslate }] },
        ]}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle}>
          <View style={styles.dragHandleBar} />
        </View>

        {/* Helper Info */}
        {helper && (
          <View style={styles.helperSection}>
            <HelperCard helper={helper} showActions={false} />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCallHelper}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="call" size={20} color="#34C759" />
            </View>
            <Text style={styles.actionText}>{t('task.call')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleChatWithHelper}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="chatbubble" size={20} color="#007AFF" />
            </View>
            <Text style={styles.actionText}>{t('task.chat')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => fitMapToCoordinates(helperLocation)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF950020' }]}>
              <Ionicons name="locate" size={20} color="#FF9500" />
            </View>
            <Text style={styles.actionText}>{t('task.locate')}</Text>
          </TouchableOpacity>
        </View>

        {/* Task Status Actions */}
        {status === TASK_STATUS.HELPER_ARRIVED && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStatus(TASK_STATUS.IN_PROGRESS)}
          >
            <Text style={styles.primaryButtonText}>
              {t('task.startWork')}
            </Text>
          </TouchableOpacity>
        )}

        {status === TASK_STATUS.IN_PROGRESS && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#34C759' }]}
            onPress={handleConfirmCompletion}
          >
            <Text style={styles.primaryButtonText}>
              {t('task.markAsComplete')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Safety Tip */}
        <View style={styles.safetyTip}>
          <Ionicons name="shield-checkmark" size={16} color="#34C759" />
          <Text style={styles.safetyTipText}>{t('task.safetyTip')}</Text>
        </View>
      </Animated.View>

      <LoadingOverlay visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
  },
  helperMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  etaCard: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  etaItem: {
    flex: 1,
    alignItems: 'center',
  },
  etaDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  etaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  etaLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  helperSection: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  safetyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C75910',
    padding: 12,
    borderRadius: 8,
  },
  safetyTipText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 6,
  },
});

export default TaskTrackingScreen;

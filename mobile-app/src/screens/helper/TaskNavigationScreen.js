import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { startTask } from '../../store/slices/helperTaskSlice';
import socketService from '../../services/socketService';

const { width, height } = Dimensions.get('window');

const TaskNavigationScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeTask } = useSelector((state) => state.helperTask);
  const { user } = useSelector((state) => state.helperAuth);
  
  const mapRef = useRef(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);

  const task = activeTask || route.params?.task;

  const destination = task?.destination || {
    latitude: 28.6139,
    longitude: 77.2090,
  };

  const origin = {
    latitude: user?.currentLatitude || 28.6129,
    longitude: user?.currentLongitude || 77.2295,
  };

  const region = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    // Calculate ETA and distance (mock calculation)
    const mockEta = Math.floor(Math.random() * 15) + 5;
    const mockDistance = (Math.random() * 5 + 1).toFixed(1);
    setEta(mockEta);
    setDistance(mockDistance);
  }, [task]);

  const handleOpenMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${destination.latitude},${destination.longitude}`,
      android: `geo:${destination.latitude},${destination.longitude}?q=${destination.latitude},${destination.longitude}`,
    });
    Linking.openURL(url);
  };

  const handleStartTask = () => {
    dispatch(startTask(task.id));
    socketService.emitTaskStart(task.id);
    navigation.replace('TaskProgress', { task });
  };

  const handleCallCustomer = () => {
    if (task?.customerPhone) {
      Linking.openURL(`tel:${task.customerPhone}`);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker
          coordinate={origin}
          title={t('helper.navigation.yourLocation')}
          pinColor="blue"
        />
        <Marker
          coordinate={destination}
          title={t('helper.navigation.destination')}
          pinColor="red"
        />
        <Polyline
          coordinates={[origin, destination]}
          strokeColor="#007AFF"
          strokeWidth={3}
          lineDashPattern={[10, 10]}
        />
      </MapView>

      {/* Task Info Card */}
      <View style={styles.taskInfoCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskType}>{task?.taskType || 'Task'}</Text>
          <View style={styles.etaContainer}>
            <Ionicons name="time" size={16} color="#007AFF" />
            <Text style={styles.etaText}>{eta} min</Text>
          </View>
        </View>

        <Text style={styles.taskTitle}>{task?.title}</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#666" />
          <Text style={styles.infoText}>
            {task?.destinationAddress || 'Customer Location'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="navigate" size={20} color="#666" />
          <Text style={styles.infoText}>
            {distance} km {t('helper.navigation.away')}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCallCustomer}>
            <Ionicons name="call" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>{t('helper.navigation.call')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleOpenMaps}>
            <Ionicons name="map" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>{t('helper.navigation.maps')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStartTask}>
          <Text style={styles.startButtonText}>
            {t('helper.navigation.arrivedStart')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height * 0.55,
  },
  taskInfoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
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
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskNavigationScreen;

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { updateOnlineStatus } from '../store/slices/helperAuthSlice';
import socketService from './socketService';
import locationApi from './locationApi';

const LOCATION_TASK_NAME = 'background-location-tracking';
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

// Request location permissions
export const requestLocationPermission = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    throw new Error('Foreground location permission not granted');
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    throw new Error('Background location permission not granted');
  }

  return true;
};

// Check if location tracking task is registered
export const isLocationTaskRegistered = async () => {
  return await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
};

// Start background location tracking
export const startLocationTracking = async () => {
  try {
    await requestLocationPermission();

    // Define the background task
    if (!await isLocationTaskRegistered()) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BALANCED,
        timeInterval: LOCATION_UPDATE_INTERVAL,
        distanceInterval: 10, // Update every 10 meters
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
    }

    console.log('Background location tracking started');
    return true;
  } catch (error) {
    console.error('Failed to start location tracking:', error);
    return false;
  }
};

// Stop background location tracking
export const stopLocationTracking = async () => {
  try {
    if (await isLocationTaskRegistered()) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    console.log('Background location tracking stopped');
    return true;
  } catch (error) {
    console.error('Failed to stop location tracking:', error);
    return false;
  }
};

// Get current location
export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.HIGH,
    });
    return location.coords;
  } catch (error) {
    console.error('Failed to get current location:', error);
    return null;
  }
};

// Watch location changes
export const watchLocation = (callback) => {
  let subscription;

  const startWatching = async () => {
    await requestLocationPermission();
    
    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.HIGH,
        timeInterval: LOCATION_UPDATE_INTERVAL,
        distanceInterval: 10,
      },
      (location) => {
        callback(location.coords);
      }
    );
  };

  startWatching();

  return () => {
    if (subscription) {
      subscription.remove();
    }
  };
};

// Send location to server
export const sendLocationToServer = async (coords) => {
  try {
    await locationApi.sendHeartbeat(
      coords.latitude,
      coords.longitude,
      coords.accuracy,
      coords.speed || 0,
      coords.heading || 0
    );
  } catch (error) {
    console.error('Failed to send location to server:', error);
  }
};

// React hook for location tracking
export const useLocationTracking = () => {
  const dispatch = useDispatch();
  const { isOnline } = useSelector((state) => state.helperAuth);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const watchSubscription = useRef(null);

  const startTracking = useCallback(async () => {
    try {
      await requestLocationPermission();
      
      watchSubscription.current = watchLocation((coords) => {
        setLocation(coords);
        sendLocationToServer(coords);
        
        // Emit via socket
        if (socketService.getConnectionStatus()) {
          socketService.emitLocationUpdate(coords);
        }
      });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (watchSubscription.current) {
      watchSubscription.current();
      watchSubscription.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isOnline, startTracking, stopTracking]);

  return { location, error, startTracking, stopTracking };
};

// Battery optimization check
export const checkBatteryOptimization = async () => {
  if (Platform.OS === 'android') {
    try {
      const PowerManager = await import('react-native').then(
        (mod) => mod.PowerManager
      );
      const isIgnoring = await PowerManager.isIgnoringBatteryOptimizations();
      return !isIgnoring;
    } catch (error) {
      console.error('Failed to check battery optimization:', error);
      return false;
    }
  }
  return false;
};

// Open battery optimization settings
export const openBatteryOptimizationSettings = async () => {
  if (Platform.OS === 'android') {
    try {
      const PowerManager = await import('react-native').then(
        (mod) => mod.PowerManager
      );
      await PowerManager.openBatteryOptimizationSettings();
    } catch (error) {
      console.error('Failed to open battery settings:', error);
    }
  }
};

export default {
  requestLocationPermission,
  startLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
  watchLocation,
  sendLocationToServer,
  useLocationTracking,
  checkBatteryOptimization,
  openBatteryOptimizationSettings,
};

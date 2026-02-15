import * as Location from 'expo-location';
import { useState, useEffect, useCallback, useRef } from 'react';

// Location tracking state
let isTracking = false;
let locationCallback = null;
let watchSubscription = null;

/**
 * Start tracking location
 * @param {Function} onLocationUpdate - Callback for location updates
 * @param {Object} options - Tracking options
 */
export const startTracking = async (onLocationUpdate, options = {}) => {
  if (isTracking) {
    console.log('Location tracking already started');
    return;
  }

  const {
    accuracy = Location.Accuracy.HIGH,
    timeInterval = 5000,
    distanceInterval = 10,
    deferredUpdatesInterval = 5000,
  } = options;

  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    locationCallback = onLocationUpdate;

    // Start watching location
    watchSubscription = await Location.watchPositionAsync(
      {
        accuracy,
        timeInterval,
        distanceInterval,
        deferredUpdatesInterval,
      },
      (location) => {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed || 0,
          heading: location.coords.heading || 0,
          altitude: location.coords.altitude || 0,
          timestamp: location.timestamp,
        };

        if (locationCallback) {
          locationCallback(coords);
        }
      }
    );

    isTracking = true;
    console.log('Location tracking started');
    return true;
  } catch (error) {
    console.error('Failed to start location tracking:', error);
    return false;
  }
};

/**
 * Stop tracking location
 */
export const stopTracking = () => {
  if (watchSubscription) {
    watchSubscription.remove();
    watchSubscription = null;
  }
  locationCallback = null;
  isTracking = false;
  console.log('Location tracking stopped');
};

/**
 * Get current location once
 */
export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.HIGH,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed || 0,
      heading: location.coords.heading || 0,
      altitude: location.coords.altitude || 0,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Failed to get current location:', error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Calculate estimated time of arrival
 */
export const calculateETA = (distance, averageSpeedKmh = 30) => {
  if (!distance || distance <= 0) return 0;
  const hours = distance / averageSpeedKmh;
  return Math.ceil(hours * 60); // Return in minutes
};

/**
 * Format location for display
 */
export const formatLocation = (latitude, longitude) => {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

/**
 * Check if location is within bounds
 */
export const isWithinBounds = (lat, lon, bounds) => {
  if (!bounds) return true;
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lon >= bounds.minLon &&
    lon <= bounds.maxLon
  );
};

/**
 * Get location address (reverse geocoding)
 */
export const getAddressFromLocation = async (latitude, longitude) => {
  try {
    const [address] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (address) {
      return {
        street: address.street,
        city: address.city,
        district: address.district,
        region: address.region,
        country: address.country,
        postalCode: address.postalCode,
        formattedAddress: `${address.street || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim(),
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
};

/**
 * React hook for location tracking
 */
export const useLocationTracker = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTrackingState, setIsTrackingState] = useState(false);

  const handleLocationUpdate = useCallback((coords) => {
    setLocation(coords);
  }, []);

  const start = useCallback(async () => {
    const success = await startTracking(handleLocationUpdate, options);
    if (success) {
      setIsTrackingState(true);
    } else {
      setError('Failed to start tracking');
    }
  }, [handleLocationUpdate, options]);

  const stop = useCallback(() => {
    stopTracking();
    setIsTrackingState(false);
  }, []);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return {
    location,
    error,
    isTracking: isTrackingState,
    start,
    stop,
  };
};

/**
 * Calculate bearing between two points
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = Math.atan2(y, x);
  bearing = toDeg(bearing);
  bearing = (bearing + 360) % 360;

  return bearing;
};

const toDeg = (rad) => rad * (180 / Math.PI);

export default {
  startTracking,
  stopTracking,
  getCurrentLocation,
  calculateDistance,
  calculateETA,
  formatLocation,
  isWithinBounds,
  getAddressFromLocation,
  useLocationTracker,
  calculateBearing,
};

import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';

// Check if running on web
const isWeb = Platform.OS === 'web';

// Location permissions
export const requestLocationPermission = async () => {
  if (isWeb) {
    // For web, we use browser's geolocation API
    return true;
  }

  if (Platform.OS === 'android') {
    const { PermissionsAndroid } = await import('react-native');
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const fineLocationGranted = granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted';
    const coarseLocationGranted = granted['android.permission.ACCESS_COARSE_LOCATION'] === 'granted';

    return fineLocationGranted || coarseLocationGranted;
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getLocationPermissionStatus = async () => {
  if (isWeb) {
    return true;
  }

  if (Platform.OS === 'android') {
    const { PermissionsAndroid } = await import('react-native');
    const fineStatus = await PermissionsAndroid.check('android.permission.ACCESS_FINE_LOCATION');
    const coarseStatus = await PermissionsAndroid.check('android.permission.ACCESS_COARSE_LOCATION');
    return fineStatus || coarseStatus;
  }

  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
};

// Camera permissions
export const requestCameraPermission = async () => {
  if (isWeb) {
    return true;
  }

  if (Platform.OS === 'android') {
    const { PermissionsAndroid } = await import('react-native');
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    return granted === 'granted';
  }

  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === 'granted';
};

export const getCameraPermissionStatus = async () => {
  if (isWeb) {
    return true;
  }

  if (Platform.OS === 'android') {
    const { PermissionsAndroid } = await import('react-native');
    return await PermissionsAndroid.check('android.permission.CAMERA');
  }

  const { status } = await Camera.getCameraPermissionsAsync();
  return status === 'granted';
};

// Media library permissions
export const requestMediaLibraryPermission = async () => {
  if (isWeb) {
    return true;
  }

  if (Platform.OS === 'android') {
    const { PermissionsAndroid } = await import('react-native');
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, {
      title: 'Photo Library Permission',
      message: 'This app needs access to your photos to upload task images.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    });
    return granted === 'granted';
  }

  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
};

export const getMediaLibraryPermissionStatus = async () => {
  if (isWeb) {
    return true;
  }

  if (Platform.OS === 'android') {
    const { PermissionsAndroid } = await import('react-native');
    return await PermissionsAndroid.check('android.permission.READ_EXTERNAL_STORAGE');
  }

  const { status } = await MediaLibrary.getPermissionsAsync();
  return status === 'granted';
};

// Notification permissions (iOS only)
export const requestNotificationPermission = async () => {
  if (isWeb || Platform.OS !== 'ios') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Check and request all required permissions
export const checkAndRequestPermissions = async (requiredPermissions = ['location', 'camera', 'media']) => {
  const permissionsMap = {
    location: { request: requestLocationPermission, name: 'Location' },
    camera: { request: requestCameraPermission, name: 'Camera' },
    media: { request: requestMediaLibraryPermission, name: 'Photo Library' },
  };

  const results = {};

  for (const perm of requiredPermissions) {
    if (permissionsMap[perm]) {
      const granted = await permissionsMap[perm].request();
      results[perm] = granted;

      if (!granted) {
        Alert.alert(
          `Permission Required`,
          `${permissionsMap[perm].name} permission is required for this feature to work properly.`,
          [{ text: 'OK' }]
        );
      }
    }
  }

  return results;
};

// Helper to show permission rationale
export const showPermissionRationale = (title, message, onRequest) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Grant Permission', onPress: onRequest },
    ]
  );
};

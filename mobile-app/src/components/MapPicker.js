import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const MapPicker = ({ onLocationSelect, initialLocation, placeholder = 'Select Location' }) => {
  const [location, setLocation] = useState(initialLocation || null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      setAddress(initialLocation.address || '');
    }
  }, [initialLocation]);

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocode to get address
      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const formattedAddress = reverseGeocode
        ? `${reverseGeocode.street}, ${reverseGeocode.city}, ${reverseGeocode.region}, ${reverseGeocode.postalCode}`
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      const locationData = {
        latitude,
        longitude,
        address: formattedAddress,
      };

      setLocation(locationData);
      setAddress(formattedAddress);
      onLocationSelect?.(locationData);
    } catch (err) {
      setError('Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSelect = () => {
    // In a real app, this would open a map view for manual location selection
    const mockLocation = {
      latitude: 17.3850,
      longitude: 78.4867,
      address: 'Hyderabad, Telangana, India',
    };
    setLocation(mockLocation);
    setAddress(mockLocation.address);
    onLocationSelect?.(mockLocation);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={location ? handleManualSelect : handleGetCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons
            name={location ? 'location-sharp' : 'location-outline'}
            size={22}
            color={location ? '#34C759' : '#007AFF'}
          />
        )}
        <Text style={styles.addressText} numberOfLines={2}>
          {address || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {location && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesText}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
  },
  addressText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#000',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  coordinatesContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default MapPicker;

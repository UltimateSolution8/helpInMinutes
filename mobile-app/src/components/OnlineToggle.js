import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { updateOnlineStatus } from '../store/slices/helperAuthSlice';
import locationService from '../services/locationService';
import socketService from '../services/socketService';

const OnlineToggle = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isOnline, token } = useSelector((state) => state.helperAuth);
  const [pulseAnim] = React.useState(new Animated.Value(1));

  useEffect(() => {
    if (isOnline) {
      // Start pulse animation when online
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Start location tracking
      locationService.startTracking();

      // Connect socket
      if (token) {
        socketService.connect(token);
        socketService.emitOnlineStatus(true);
      }

      return () => {
        pulse.stop();
        locationService.stopTracking();
      };
    } else {
      // Stop location tracking
      locationService.stopTracking();
      
      // Update socket status
      if (token) {
        socketService.emitOnlineStatus(false);
      }
    }
  }, [isOnline, token]);

  const handleToggle = () => {
    const newStatus = !isOnline;
    dispatch(updateOnlineStatus(newStatus));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.toggleContainer, isOnline && styles.toggleContainerActive]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.toggleKnob,
            isOnline && styles.toggleKnobActive,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={[styles.statusDot, isOnline && styles.statusDotActive]} />
        </Animated.View>

        <Text style={[styles.statusText, isOnline && styles.statusTextActive]}>
          {isOnline ? t('helper.toggle.online') : t('helper.toggle.offline')}
        </Text>
      </TouchableOpacity>

      {isOnline && (
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.infoText}>{t('helper.toggle.trackingLocation')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('helper.toggle.receivingTasks')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    padding: 4,
    height: 56,
  },
  toggleContainerActive: {
    backgroundColor: '#4CAF50',
  },
  toggleKnob: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleKnobActive: {
    transform: [{ scale: 1.1 }],
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  statusDotActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 48,
  },
  statusTextActive: {
    color: '#fff',
  },
  infoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 24,
  },
});

export default OnlineToggle;

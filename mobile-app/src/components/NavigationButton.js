import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

const NavigationButton = ({ latitude, longitude, destinationName }) => {
  const { t } = useTranslation();

  const handlePress = () => {
    const label = encodeURIComponent(destinationName || 'Destination');
    
    let url;
    if (Platform.OS === 'ios') {
      url = `maps:0,0?q=${label}@${latitude},${longitude}`;
    } else {
      url = `google.navigation:q=${latitude},${longitude}&mode=d`;
    }

    Linking.openURL(url).catch((err) => {
      // Fallback to browser if maps app is not available
      const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(browserUrl);
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Ionicons name="navigate" size={20} color="#007AFF" />
      <Text style={styles.text}>{t('navigation.openMaps')}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
});

export default NavigationButton;

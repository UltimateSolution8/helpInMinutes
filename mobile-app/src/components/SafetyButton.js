import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import socketService from '../services/socketService';

const SafetyButton = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.helperAuth);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handleLongPress = () => {
    setShowConfirmModal(true);
  };

  const handlePanicTrigger = () => {
    setShowConfirmModal(false);
    
    // Get current location (in a real app, this would come from location service)
    const location = {
      latitude: 28.6139,
      longitude: 77.2090,
    };

    // Emit safety alert via socket
    socketService.emitSafetyAlert(location);

    // Show confirmation
    Alert.alert(
      t('safety.alertSent'),
      t('safety.alertSentMessage'),
      [{ text: t('common.ok') }]
    );
  };

  const cancelPanic = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.safetyButton, isPressed && styles.safetyButtonPressed]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={1000}
      >
        <Ionicons name="alert-circle" size={28} color="#fff" />
        <Text style={styles.safetyButtonText}>{t('safety.sos')}</Text>
      </TouchableOpacity>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningIcon}>
              <Ionicons name="warning" size={48} color="#FF9800" />
            </View>
            <Text style={styles.modalTitle}>{t('safety.confirmTitle')}</Text>
            <Text style={styles.modalText}>{t('safety.confirmMessage')}</Text>
            <Text style={styles.modalSubtext}>
              {t('safety.confirmSubtext')}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelPanic}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handlePanicTrigger}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>{t('safety.sendAlert')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safetyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  safetyButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  safetyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  warningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default SafetyButton;

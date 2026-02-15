import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const timeSlots = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    timeSlots.push(`${h}:${m}`);
  }
}

const AvailabilityPicker = ({ day, schedule, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [startTime, setStartTime] = useState(schedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(schedule?.endTime || '18:00');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleSave = () => {
    onSave({
      day,
      startTime,
      endTime,
      enabled: true,
    });
  };

  const handleClear = () => {
    onSave({
      day,
      startTime: '00:00',
      endTime: '00:00',
      enabled: false,
    });
  };

  const getDayName = (day) => {
    switch (day) {
      case 'monday': return t('schedule.monday');
      case 'tuesday': return t('schedule.tuesday');
      case 'wednesday': return t('schedule.wednesday');
      case 'thursday': return t('schedule.thursday');
      case 'friday': return t('schedule.friday');
      case 'saturday': return t('schedule.saturday');
      case 'sunday': return t('schedule.sunday');
      default: return day;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dayName}>{getDayName(day)}</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>{t('schedule.clear')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timePickerItem}>
          <Text style={styles.label}>{t('schedule.startTime')}</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
            <Ionicons name="time" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.timeDivider}>
          <Text style={styles.toText}>{t('schedule.to')}</Text>
        </View>

        <View style={styles.timePickerItem}>
          <Text style={styles.label}>{t('schedule.endTime')}</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
            <Ionicons name="time" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      {/* Start Time Picker Modal */}
      <Modal
        visible={showStartPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>{t('schedule.selectStartTime')}</Text>
            <ScrollView>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeOption, time === startTime && styles.timeOptionSelected]}
                  onPress={() => {
                    setStartTime(time);
                    setShowStartPicker(false);
                  }}
                >
                  <Text style={[styles.timeOptionText, time === startTime && styles.timeOptionTextSelected]}>
                    {formatTime(time)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={showEndPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>{t('schedule.selectEndTime')}</Text>
            <ScrollView>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeOption, time === endTime && styles.timeOptionSelected]}
                  onPress={() => {
                    setEndTime(time);
                    setShowEndPicker(false);
                  }}
                >
                  <Text style={[styles.timeOptionText, time === endTime && styles.timeOptionTextSelected]}>
                    {formatTime(time)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timePickerItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  timeDivider: {
    paddingHorizontal: 16,
  },
  toText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '50%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeOption: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  timeOptionText: {
    fontSize: 18,
    color: '#333',
  },
  timeOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default AvailabilityPicker;

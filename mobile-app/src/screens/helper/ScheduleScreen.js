import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchSchedule,
  updateWeeklySchedule,
  setImmediateAvailability,
  toggleDay,
  setTimeRange,
} from '../../store/slices/scheduleSlice';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ScheduleScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { weeklySchedule, isAvailable, loading } = useSelector((state) => state.schedule);
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [tempStartTime, setTempStartTime] = useState('09:00');
  const [tempEndTime, setTempEndTime] = useState('18:00');

  useEffect(() => {
    dispatch(fetchSchedule());
  }, [dispatch]);

  const handleToggleDay = (day) => {
    dispatch(toggleDay(day));
  };

  const handleTimeChange = (day, startTime, endTime) => {
    dispatch(setTimeRange({ day, startTime, endTime }));
  };

  const openTimePicker = (day) => {
    setSelectedDay(day);
    setTempStartTime(weeklySchedule[day].startTime);
    setTempEndTime(weeklySchedule[day].endTime);
    setShowTimePicker(true);
  };

  const saveTimeRange = () => {
    if (selectedDay) {
      handleTimeChange(selectedDay, tempStartTime, tempEndTime);
    }
    setShowTimePicker(false);
  };

  const handleSaveSchedule = () => {
    dispatch(updateWeeklySchedule(weeklySchedule));
    Alert.alert(t('schedule.saved'), t('schedule.savedMessage'));
  };

  const handleToggleAvailability = () => {
    dispatch(setImmediateAvailability(!isAvailable));
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Immediate Availability */}
      <View style={styles.availabilityCard}>
        <View style={styles.availabilityInfo}>
          <Text style={styles.availabilityTitle}>{t('schedule.availableNow')}</Text>
          <Text style={styles.availabilitySubtitle}>
            {isAvailable ? t('schedule.receivingTasks') : t('schedule.notReceivingTasks')}
          </Text>
        </View>
        <Switch
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor="#fff"
          onValueChange={handleToggleAvailability}
          value={isAvailable}
        />
      </View>

      {/* Weekly Schedule */}
      <View style={styles.scheduleCard}>
        <Text style={styles.sectionTitle}>{t('schedule.weeklyAvailability')}</Text>
        <Text style={styles.sectionSubtitle}>{t('schedule.setWeeklyHours')}</Text>

        {days.map((day) => (
          <View key={day} style={styles.dayRow}>
            <View style={styles.dayInfo}>
              <Switch
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor="#fff"
                onValueChange={() => handleToggleDay(day)}
                value={weeklySchedule[day]?.enabled}
              />
              <Text style={styles.dayName}>{getDayName(day)}</Text>
            </View>

            {weeklySchedule[day]?.enabled ? (
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => openTimePicker(day)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTime(weeklySchedule[day]?.startTime)} - {formatTime(weeklySchedule[day]?.endTime)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.closedText}>{t('schedule.closed')}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveSchedule}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>{t('schedule.saveSchedule')}</Text>
      </TouchableOpacity>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {getDayName(selectedDay)} - {t('schedule.setHours')}
            </Text>

            <View style={styles.timePickerRow}>
              <View style={styles.timePickerItem}>
                <Text style={styles.timePickerLabel}>{t('schedule.startTime')}</Text>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => {
                    // Show time picker
                  }}
                >
                  <Text style={styles.timeDisplayText}>{formatTime(tempStartTime)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timePickerItem}>
                <Text style={styles.timePickerLabel}>{t('schedule.endTime')}</Text>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => {
                    // Show time picker
                  }}
                >
                  <Text style={styles.timeDisplayText}>{formatTime(tempEndTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveTimeRange}
              >
                <Text style={styles.modalSaveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  availabilityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  closedText: {
    fontSize: 14,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timePickerItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  timeDisplay: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeDisplayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ScheduleScreen;

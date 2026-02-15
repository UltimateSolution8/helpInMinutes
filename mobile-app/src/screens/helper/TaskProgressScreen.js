import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { completeTask, clearActiveTask } from '../../store/slices/helperTaskSlice';
import socketService from '../../services/socketService';

const TaskProgressScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeTask } = useSelector((state) => state.helperTask);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const task = activeTask || route.params?.task;

  useEffect(() => {
    if (!task) {
      navigation.goBack();
    }
  }, [task, navigation]);

  const steps = [
    { id: 1, title: t('helper.task.arrived'), icon: 'location' },
    { id: 2, title: t('helper.task.started'), icon: 'play' },
    { id: 3, title: t('helper.task.completed'), icon: 'checkmark-circle' },
  ];

  const handleStep1Complete = () => {
    setCurrentStep(2);
  };

  const handleStep2Complete = () => {
    setCurrentStep(3);
  };

  const handleCompleteTask = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert(t('common.error'), t('helper.task.otpRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(completeTask({ 
        taskId: task.id, 
        otp, 
        completionNotes 
      })).unwrap();
      
      socketService.emitTaskComplete(task.id, otp);
      
      Alert.alert(
        t('helper.task.success'),
        t('helper.task.completedMessage'),
        [{ text: t('common.ok'), onPress: () => {
          dispatch(clearActiveTask());
          navigation.popToTop();
        }}]
      );
    } catch (error) {
      Alert.alert(t('common.error'), error || t('helper.task.completionFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = () => {
    // In a real app, this would call an API to resend OTP
    Alert.alert(t('helper.task.otpSent'), t('helper.task.otpSentMessage'));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.progressItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= step.id && styles.stepCircleActive,
              ]}
            >
              <Ionicons
                name={step.icon}
                size={24}
                color={currentStep >= step.id ? '#fff' : '#999'}
              />
            </View>
            <Text
              style={[
                styles.stepTitle,
                currentStep >= step.id && styles.stepTitleActive,
              ]}
            >
              {step.title}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  currentStep > step.id && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Task Details */}
      <View style={styles.taskCard}>
        <Text style={styles.taskTitle}>{task?.title}</Text>
        <Text style={styles.taskId}>{t('helper.task.id', { id: task?.id })}</Text>
        
        <View style={styles.earningsContainer}>
          <Text style={styles.earningsLabel}>{t('helper.task.earnings')}</Text>
          <Text style={styles.earningsValue}>
            {formatCurrency(task?.estimatedEarnings || task?.amount || 0)}
          </Text>
        </View>
      </View>

      {/* Step Content */}
      {currentStep === 1 && (
        <View style={styles.stepContent}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.infoText}>{t('helper.task.arrivedMessage')}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStep1Complete}
          >
            <Text style={styles.actionButtonText}>{t('helper.task.confirmArrived')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 2 && (
        <View style={styles.stepContent}>
          <View style={styles.infoBox}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.infoText}>{t('helper.task.startedMessage')}</Text>
          </View>

          <View style={styles.notesContainer}>
            <Text style={styles.label}>{t('helper.task.completionNotes')}</Text>
            <TextInput
              style={styles.notesInput}
              placeholder={t('helper.task.notesPlaceholder')}
              placeholderTextColor="#999"
              value={completionNotes}
              onChangeText={setCompletionNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStep2Complete}
          >
            <Text style={styles.actionButtonText}>{t('helper.task.markComplete')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 3 && (
        <View style={styles.stepContent}>
          <Text style={styles.otpTitle}>{t('helper.task.enterOtp')}</Text>
          <Text style={styles.otpSubtitle}>{t('helper.task.otpFromCustomer')}</Text>

          <View style={styles.otpContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="XXXX"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={4}
              textAlign="center"
            />
          </View>

          <TouchableOpacity style={styles.resendButton} onPress={handleRequestOtp}>
            <Text style={styles.resendButtonText}>{t('helper.task.resendOtp')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isSubmitting && styles.actionButtonDisabled]}
            onPress={handleCompleteTask}
            disabled={isSubmitting}
          >
            <Text style={styles.actionButtonText}>
              {isSubmitting ? t('common.processing') : t('helper.task.submitTask')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#007AFF',
  },
  stepTitle: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#333',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 25,
    left: '50%',
    width: '100%',
    height: 3,
    backgroundColor: '#E0E0E0',
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: '#007AFF',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskId: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  stepContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 16,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TaskProgressScreen;

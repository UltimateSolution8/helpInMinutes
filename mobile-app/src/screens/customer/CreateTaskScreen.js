import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

import { createTaskStart, createTaskSuccess, createTaskFailure } from '../../store/slices/taskSlice';
import { createTask } from '../../services/taskApi';
import MapPicker from '../../components/MapPicker';
import SkillSelector from '../../components/SkillSelector';
import LoadingOverlay from '../../components/LoadingOverlay';
import { requestLocationPermissions } from '../../utils/permissions';

const URGENCY_LEVELS = [
  { id: 'LOW', label: 'Low', color: '#34C759', icon: 'time-outline' },
  { id: 'MEDIUM', label: 'Medium', color: '#FF9500', icon: 'alert-outline' },
  { id: 'HIGH', label: 'High', color: '#FF3B30', icon: 'warning-outline' },
  { id: 'URGENT', label: 'Urgent', color: '#AF52DE', icon: 'flash-outline' },
];

const CreateTaskScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.task);

  const [step, setStep] = useState(1);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    skillId: null,
    skillName: '',
    urgency: 'MEDIUM',
    location: null,
    address: '',
    budget: '',
    images: [],
    voiceNote: null,
  });

  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef(null);

  useEffect(() => {
    if (route.params?.preselectedCategory) {
      // Pre-select category if passed from home
    }
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const hasPermission = await requestLocationPermissions();
    if (hasPermission) {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setTaskData((prev) => ({
        ...prev,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      }));
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleLocationSelected = (location, address) => {
    setTaskData((prev) => ({
      ...prev,
      location,
      address,
    }));
  };

  const handleSkillSelected = (skill) => {
    setTaskData((prev) => ({
      ...prev,
      skillId: skill.id,
      skillName: skill.name,
    }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('task.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      maxFiles: 5,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setTaskData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 5),
      }));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('task.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setTaskData((prev) => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri].slice(0, 5),
      }));
    }
  };

  const removeImage = (index) => {
    setTaskData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('task.microphonePermissionRequired'));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      clearInterval(recordingTimer.current);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setTaskData((prev) => ({ ...prev, voiceNote: uri }));
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const removeVoiceNote = () => {
    setTaskData((prev) => ({ ...prev, voiceNote: null }));
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!taskData.title.trim()) {
          Alert.alert(t('common.error'), t('task.titleRequired'));
          return false;
        }
        if (!taskData.skillId) {
          Alert.alert(t('common.error'), t('task.skillRequired'));
          return false;
        }
        return true;
      case 2:
        if (!taskData.location) {
          Alert.alert(t('common.error'), t('task.locationRequired'));
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        submitTask();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const submitTask = async () => {
    dispatch(createTaskStart());
    try {
      const result = await createTask(taskData);
      dispatch(createTaskSuccess(result));
      navigation.navigate('TaskMatching', { taskId: result.id });
    } catch (err) {
      dispatch(createTaskFailure(err.message));
      Alert.alert(t('common.error'), err.message || t('task.createFailed'));
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('task.whatDoYouNeed')}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('task.taskTitle')}</Text>
        <TextInput
          style={styles.textInput}
          placeholder={t('task.titlePlaceholder')}
          value={taskData.title}
          onChangeText={(text) => setTaskData((prev) => ({ ...prev, title: text }))}
          maxLength={100}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('task.selectSkill')}</Text>
        <SkillSelector
          selectedSkill={taskData.skillId}
          onSelect={handleSkillSelected}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('task.urgencyLevel')}</Text>
        <View style={styles.urgencyContainer}>
          {URGENCY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.urgencyButton,
                taskData.urgency === level.id && { backgroundColor: level.color },
              ]}
              onPress={() => setTaskData((prev) => ({ ...prev, urgency: level.id }))}
            >
              <Ionicons
                name={level.icon}
                size={20}
                color={taskData.urgency === level.id ? '#fff' : level.color}
              />
              <Text
                style={[
                  styles.urgencyText,
                  taskData.urgency === level.id && { color: '#fff' },
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('task.description')}</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder={t('task.descriptionPlaceholder')}
          value={taskData.description}
          onChangeText={(text) => setTaskData((prev) => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{taskData.description.length}/500</Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('task.whereDoYouNeedHelp')}</Text>

      <MapPicker
        initialLocation={taskData.location}
        onLocationSelected={handleLocationSelected}
      />

      {taskData.address ? (
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.addressText}>{taskData.address}</Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('task.additionalAddress')}</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder={t('task.addressPlaceholder')}
          value={taskData.address}
          onChangeText={(text) => setTaskData((prev) => ({ ...prev, address: text }))}
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('task.addDetails')}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('task.budget')}</Text>
        <View style={styles.budgetContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder={t('task.budgetPlaceholder')}
            value={taskData.budget}
            onChangeText={(text) => setTaskData((prev) => ({ ...prev, budget: text }))}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('task.photos')}</Text>
        <View style={styles.photosContainer}>
          {taskData.images.map((uri, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          {taskData.images.length < 5 && (
            <View style={styles.addPhotoButtons}>
              <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#007AFF" />
                <Text style={styles.addPhotoText}>{t('task.camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                <Ionicons name="images" size={24} color="#007AFF" />
                <Text style={styles.addPhotoText}>{t('task.gallery')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('task.voiceNote')}</Text>
        {taskData.voiceNote ? (
          <View style={styles.voiceNoteContainer}>
            <Ionicons name="mic" size={24} color="#007AFF" />
            <Text style={styles.voiceNoteText}>{t('task.voiceNoteRecorded')}</Text>
            <TouchableOpacity onPress={removeVoiceNote}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={24}
              color={isRecording ? '#fff' : '#FF3B30'}
            />
            <Text style={[styles.recordText, isRecording && styles.recordingText]}>
              {isRecording
                ? `${t('task.recording')} ${formatDuration(recordingDuration)}`
                : t('task.holdToRecord')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('task.createTask')}</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            {t('task.step')} {step} {t('task.of')} 3
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {step === 3 ? t('task.postTask') : t('task.next')}
          </Text>
          <Ionicons
            name={step === 3 ? 'checkmark' : 'arrow-forward'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <LoadingOverlay visible={loading} message={t('task.creatingTask')} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  stepIndicator: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stepText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  urgencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urgencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  voiceNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  voiceNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  recordText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  recordingText: {
    color: '#fff',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTaskScreen;

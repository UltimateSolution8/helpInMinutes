import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { submitKyc } from '../../store/slices/kycSlice';

const KycUploadScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { kycStatus, documents, uploading, error } = useSelector((state) => state.kyc);

  const [documentNumbers, setDocumentNumbers] = useState({
    aadhaar: '',
    pan: '',
    bankAccount: '',
    ifsc: '',
  });

  const [capturedImages, setCapturedImages] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    pan: null,
    bankCheque: null,
  });

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('kyc.cameraPermissionRequired'));
      }
    })();
  }, []);

  const pickImage = async (type, side) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const key = side ? `${type}${side}` : type;
        setCapturedImages({ ...capturedImages, [key]: result.assets[0] });
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('kyc.cameraError'));
    }
  };

  const renderDocumentSection = (title, type, fields, imageKeys) => (
    <View style={styles.documentSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      {fields.map((field) => (
        <View key={field.key} style={styles.inputContainer}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor="#999"
            value={documentNumbers[field.key]}
            onChangeText={(value) =>
              setDocumentNumbers({ ...documentNumbers, [field.key]: value })
            }
            keyboardType={field.keyboardType || 'default'}
          />
        </View>
      ))}

      {imageKeys.map((imageKey) => (
        <View key={imageKey.key} style={styles.imageContainer}>
          <Text style={styles.label}>{imageKey.label}</Text>
          {capturedImages[imageKey.key] ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: capturedImages[imageKey.key].uri }}
                style={styles.previewImage}
              />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => pickImage(imageKey.type, imageKey.side)}
              >
                <Text style={styles.retakeButtonText}>{t('kyc.retake')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => pickImage(imageKey.type, imageKey.side)}
            >
              <Ionicons name="camera" size={32} color="#007AFF" />
              <Text style={styles.captureButtonText}>{imageKey.buttonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const handleSubmit = async () => {
    // Validate all required documents
    if (!capturedImages.aadhaarFront || !capturedImages.aadhaarBack) {
      Alert.alert(t('common.error'), t('kyc.aadhaarRequired'));
      return;
    }
    if (!capturedImages.pan) {
      Alert.alert(t('common.error'), t('kyc.panRequired'));
      return;
    }
    if (!capturedImages.bankCheque) {
      Alert.alert(t('common.error'), t('kyc.bankChequeRequired'));
      return;
    }

    dispatch(submitKyc());
    navigation.replace('KycPending');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('kyc.title')}</Text>
        <Text style={styles.subtitle}>{t('kyc.subtitle')}</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {renderDocumentSection(
        t('kyc.aadhaar'),
        'aadhaar',
        [
          { key: 'aadhaar', label: t('kyc.aadhaarNumber'), placeholder: 'XXXX XXXX XXXX' },
        ],
        [
          {
            key: 'aadhaarFront',
            type: 'aadhaar',
            side: 'Front',
            label: t('kyc.frontSide'),
            buttonText: t('kyc.captureFront'),
          },
          {
            key: 'aadhaarBack',
            type: 'aadhaar',
            side: 'Back',
            label: t('kyc.backSide'),
            buttonText: t('kyc.captureBack'),
          },
        ]
      )}

      {renderDocumentSection(
        t('kyc.pan'),
        'pan',
        [{ key: 'pan', label: t('kyc.panNumber'), placeholder: 'XXXXXXXXXX' }],
        [
          {
            key: 'pan',
            type: 'pan',
            label: t('kyc.panCard'),
            buttonText: t('kyc.capturePan'),
          },
        ]
      )}

      {renderDocumentSection(
        t('kyc.bankAccount'),
        'bank',
        [
          { key: 'bankAccount', label: t('kyc.accountNumber'), placeholder: 'XXXXXXXXXXXX' },
          { key: 'ifsc', label: t('kyc.ifscCode'), placeholder: 'XXXXXXXXXXXX', keyboardType: 'default' },
        ],
        [
          {
            key: 'bankCheque',
            type: 'bank',
            label: t('kyc.cancelledCheque'),
            buttonText: t('kyc.captureCheque'),
          },
        ]
      )}

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('kyc.submit')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  documentSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  imageContainer: {
    marginTop: 12,
  },
  captureButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
  },
  captureButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  previewContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default KycUploadScreen;

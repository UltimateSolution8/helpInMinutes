import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadKycDocument } from '../store/slices/kycSlice';

const KycUploader = ({ documentType, label, required, onUpload }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('PENDING'); // PENDING, UPLOADING, UPLOADED, ERROR

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('kyc.cameraPermissionRequired'));
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        handleUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('kyc.cameraError'));
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        handleUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('kyc.documentError'));
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setStatus('UPLOADING');

    try {
      await dispatch(uploadKycDocument({
        documentType,
        file,
      })).unwrap();
      
      setStatus('UPLOADED');
      onUpload?.({ documentType, status: 'UPLOADED', file });
    } catch (error) {
      setStatus('ERROR');
      Alert.alert(t('common.error'), t('kyc.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const retake = () => {
    setImage(null);
    setStatus('PENDING');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'UPLOADED':
        return '#4CAF50';
      case 'ERROR':
        return '#D32F2F';
      case 'UPLOADING':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'UPLOADED':
        return t('kyc.uploaded');
      case 'ERROR':
        return t('kyc.uploadFailed');
      case 'UPLOADING':
        return t('kyc.uploading');
      default:
        return t('kyc.notUploaded');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {image ? (
        <View style={styles.previewContainer}>
          {image.type === 'image' ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons name="document" size={48} color="#007AFF" />
              <Text style={styles.documentName}>{image.name}</Text>
            </View>
          )}

          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.uploadingText}>{t('kyc.processing')}</Text>
            </View>
          ) : (
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.actionButton} onPress={retake}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>{t('kyc.retake')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.uploadOptions}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="camera" size={32} color="#007AFF" />
            <Text style={styles.uploadButtonText}>{t('kyc.takePhoto')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickDocument}
            disabled={uploading}
          >
            <Ionicons name="folder" size={32} color="#007AFF" />
            <Text style={styles.uploadButtonText}>{t('kyc.chooseFile')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  required: {
    color: '#D32F2F',
    marginLeft: 4,
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 8,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  documentPreview: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  documentName: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  previewActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default KycUploader;

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Document Scanner utility for KYC document capture and processing
 */

// Request camera permissions
export const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

// Request media library permissions
export const requestMediaLibraryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

// Launch camera for document capture
export const captureDocument = async (options = {}) => {
  const {
    allowsEditing = true,
    aspect = [4, 3],
    quality = 0.8,
    mediaTypes = ImagePicker.MediaTypeOptions.Images,
  } = options;

  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes,
      allowsEditing,
      aspect,
      quality,
      base64: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Camera capture failed:', error);
    throw error;
  }
};

// Pick from gallery
export const pickFromGallery = async (options = {}) => {
  const {
    allowsEditing = true,
    aspect = [4, 3],
    quality = 0.8,
    mediaTypes = ImagePicker.MediaTypeOptions.Images,
  } = options;

  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing,
      aspect,
      quality,
      base64: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Gallery pick failed:', error);
    throw error;
  }
};

// Process image for better OCR
export const processImageForOCR = async (imageUri) => {
  try {
    // Resize image for better processing
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1024 } },
      ],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Get base64
    const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      uri: manipulated.uri,
      base64,
      width: manipulated.width,
      height: manipulated.height,
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    // Return original if processing fails
    return {
      uri: imageUri,
      base64: null,
    };
  }
};

// Validate document image quality
export const validateDocumentQuality = (image) => {
  const issues = [];

  if (!image) {
    return { valid: false, issues: ['No image provided'] };
  }

  // Check file size (max 5MB)
  if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
    issues.push('Image file size exceeds 5MB');
  }

  // Check dimensions
  if (image.width && image.height) {
    if (image.width < 300 || image.height < 400) {
      issues.push('Image resolution is too low');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};

// Extract text from image using OCR (simulated - would use actual OCR service)
export const extractTextFromImage = async (image) => {
  // In a real app, this would call an OCR API
  // For now, return mock data
  console.log('Extracting text from:', image?.uri);

  // Simulated OCR result
  return {
    rawText: '',
    confidence: 0,
    fields: {},
  };
};

// Validate Aadhaar number format
export const validateAadhaarNumber = (aadhaarNumber) => {
  // Aadhaar is 12 digits, sometimes written with spaces
  const cleaned = aadhaarNumber.replace(/\s/g, '');
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(cleaned);
};

// Validate PAN number format
export const validatePanNumber = (panNumber) => {
  // PAN format: 5 letters, 4 digits, 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(panNumber.toUpperCase());
};

// Validate IFSC code format
export const validateIfscCode = (ifscCode) => {
  // IFSC format: 4 letters, 7 alphanumeric
  const ifscRegex = /^[A-Z]{4}[0-9]{7}$/;
  return ifscRegex.test(ifscCode.toUpperCase());
};

// Validate bank account number (basic check)
export const validateBankAccountNumber = (accountNumber) => {
  // Account number should be 9-18 digits
  const cleaned = accountNumber.replace(/\s/g, '');
  return /^\d{9,18}$/.test(cleaned);
};

// Detect document type from image (basic heuristic)
export const detectDocumentType = (image) => {
  if (!image) return null;

  // In a real app, this would use ML to detect document type
  // For now, return based on user selection
  return 'UNKNOWN';
};

// Get document type from MIME type
export const getDocumentTypeFromMime = (mimeType) => {
  if (mimeType?.startsWith('image/')) {
    return 'IMAGE';
  }
  if (mimeType === 'application/pdf') {
    return 'PDF';
  }
  return 'UNKNOWN';
};

// Compress image for upload
export const compressImage = async (imageUri, maxSizeKB = 500) => {
  try {
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    
    if (imageInfo.size <= maxSizeKB * 1024) {
      return { uri: imageUri, compressed: false };
    }

    // Compress image
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1200 } },
      ],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    const compressedInfo = await FileSystem.getInfoAsync(result.uri);
    
    return {
      uri: result.uri,
      compressed: true,
      originalSize: imageInfo.size,
      compressedSize: compressedInfo.size,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    return { uri: imageUri, compressed: false };
  }
};

// Create file for upload
export const createUploadFile = async (image) => {
  const processed = await processImageForOCR(image.uri);
  const validation = validateDocumentQuality(image);
  const compression = await compressImage(image.uri);

  return {
    uri: compression.uri,
    name: `document_${Date.now()}.jpg`,
    type: 'image/jpeg',
    base64: processed.base64,
    validation,
    compressed: compression.compressed,
  };
};

export default {
  requestCameraPermission,
  requestMediaLibraryPermission,
  captureDocument,
  pickFromGallery,
  processImageForOCR,
  validateDocumentQuality,
  extractTextFromImage,
  validateAadhaarNumber,
  validatePanNumber,
  validateIfscCode,
  validateBankAccountNumber,
  detectDocumentType,
  getDocumentTypeFromMime,
  compressImage,
  createUploadFile,
};

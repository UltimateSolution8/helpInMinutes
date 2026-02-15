import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  CheckBox,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { helperRegister, clearError } from '../../store/slices/helperAuthSlice';

const HelperRegistrationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.helperAuth);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState(1);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      Alert.alert(t('common.error'), t('helper.register.error.emptyFields'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert(t('common.error'), t('helper.register.error.invalidEmail'));
      return false;
    }
    if (formData.phone.length < 10) {
      Alert.alert(t('common.error'), t('helper.register.error.invalidPhone'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      Alert.alert(t('common.error'), t('helper.register.error.emptyFields'));
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert(t('common.error'), t('helper.register.error.passwordLength'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('common.error'), t('helper.register.error.passwordMismatch'));
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.city || !formData.state || !formData.pincode) {
      Alert.alert(t('common.error'), t('helper.register.error.emptyFields'));
      return false;
    }
    if (!acceptedTerms) {
      Alert.alert(t('common.error'), t('helper.register.error.termsRequired'));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRegister = () => {
    if (validateStep3()) {
      dispatch(clearError());
      dispatch(
        helperRegister({
          ...formData,
          role: 'HELPER',
        })
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            {step > 1 && <Ionicons name="arrow-back" size={24} color="#007AFF" />}
          </TouchableOpacity>
          <Text style={styles.stepText}>{t('helper.register.step', { current: step, total: 3 })}</Text>
        </View>

        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[styles.progressDot, s <= step && styles.progressDotActive]}
            />
          ))}
        </View>

        <Text style={styles.title}>
          {step === 1 && t('helper.register.step1Title')}
          {step === 2 && t('helper.register.step2Title')}
          {step === 3 && t('helper.register.step3Title')}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('helper.register.fullName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('helper.register.fullNamePlaceholder')}
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('common.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('common.emailPlaceholder')}
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('common.phone')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('common.phonePlaceholder')}
                placeholderTextColor="#999"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('common.password')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('common.passwordPlaceholder')}
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('helper.register.confirmPassword')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('helper.register.confirmPasswordPlaceholder')}
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('helper.register.city')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('helper.register.cityPlaceholder')}
                placeholderTextColor="#999"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>{t('helper.register.state')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('helper.register.statePlaceholder')}
                  placeholderTextColor="#999"
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>{t('helper.register.pincode')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('helper.register.pincodePlaceholder')}
                  placeholderTextColor="#999"
                  value={formData.pincode}
                  onChangeText={(value) => handleInputChange('pincode', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.termsContainer}>
              <CheckBox
                value={acceptedTerms}
                onValueChange={setAcceptedTerms}
                tintColors={{ true: '#007AFF', false: '#999' }}
              />
              <Text style={styles.termsText}>
                {t('helper.register.agreeTerms')}{' '}
                <Text style={styles.termsLink}>{t('helper.register.termsOfService')}</Text>
                {' '}{t('common.and')}{' '}
                <Text style={styles.termsLink}>{t('helper.register.privacyPolicy')}</Text>
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={step < 3 ? handleNext : handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step < 3 ? t('common.next') : t('helper.register.button')}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{t('helper.register.haveAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>{t('helper.login.button')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  stepText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
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
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default HelperRegistrationScreen;

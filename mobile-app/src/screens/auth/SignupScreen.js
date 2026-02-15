import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { signupStart, signupSuccess, signupFailure, clearError } from '../../store/slices/authSlice';
import { registerUser } from '../../services/authApi';

const SignupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error);
      dispatch(clearError());
    }
  }, [error, dispatch, t]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('auth.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('auth.lastNameRequired');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = t('auth.phoneRequired');
    } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = t('auth.invalidPhone');
    }

    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.passwordTooShort');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('auth.passwordRequirements');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
    }

    if (!agreedToTerms) {
      newErrors.terms = t('auth.termsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    dispatch(signupStart());
    try {
      const result = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'CUSTOMER',
      });
      dispatch(signupSuccess(result));
      Alert.alert(
        t('auth.signupSuccess'),
        t('auth.accountCreated'),
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      dispatch(signupFailure(err.message || t('auth.signupFailed')));
    }
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      handleChange('phone', cleaned);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.firstName')}
                value={formData.firstName}
                onChangeText={(text) => handleChange('firstName', text)}
                autoCapitalize="words"
                accessibilityLabel={t('auth.firstNameLabel')}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <TextInput
                style={styles.input}
                placeholder={t('auth.lastName')}
                value={formData.lastName}
                onChangeText={(text) => handleChange('lastName', text)}
                autoCapitalize="words"
                accessibilityLabel={t('auth.lastNameLabel')}
              />
            </View>
          </View>
          {(errors.firstName || errors.lastName) && (
            <Text style={styles.errorText}>
              {errors.firstName || errors.lastName}
            </Text>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.emailPlaceholder')}
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel={t('auth.emailLabel')}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.phonePlaceholder')}
              value={formData.phone}
              onChangeText={formatPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              accessibilityLabel={t('auth.phoneLabel')}
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.passwordPlaceholder')}
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry={!showPassword}
              accessibilityLabel={t('auth.passwordLabel')}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              accessibilityLabel={t('auth.confirmPasswordLabel')}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          <View style={styles.passwordHint}>
            <Ionicons name="information-circle-outline" size={14} color="#666" />
            <Text style={styles.passwordHintText}>{t('auth.passwordHint')}</Text>
          </View>

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              if (errors.terms) setErrors((prev) => ({ ...prev, terms: null }));
            }}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              {t('auth.agreeToTerms')}{' '}
              <Text style={styles.termsLink}>{t('auth.termsOfService')}</Text>
              {' '}{t('auth.and')}{' '}
              <Text style={styles.termsLink}>{t('auth.privacyPolicy')}</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            accessibilityLabel={t('auth.signupButton')}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>{t('auth.createAccountButton')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
    height: 50,
    flex: 1,
  },
  halfWidth: {
    flex: 0.48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  passwordHintText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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

export default SignupScreen;

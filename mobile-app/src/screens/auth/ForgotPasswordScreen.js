import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { forgotPassword, resetPassword } from '../../services/authApi';

const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return false;
    } else if (!emailRegex.test(email)) {
      setError(t('auth.invalidEmail'));
      return false;
    }
    setError('');
    return true;
  };

  const validateOtp = () => {
    if (!otp.trim() || otp.length !== 6) {
      setError(t('auth.invalidOtp'));
      return false;
    }
    setError('');
    return true;
  };

  const validatePassword = () => {
    if (!newPassword) {
      setError(t('auth.passwordRequired'));
      return false;
    } else if (newPassword.length < 8) {
      setError(t('auth.passwordTooShort'));
      return false;
    } else if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return false;
    }
    setError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert(t('common.success'), t('auth.otpSent'));
      setStep(2);
    } catch (err) {
      setError(err.message || t('auth.otpSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!validateOtp()) return;
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      Alert.alert(
        t('common.success'),
        t('auth.passwordResetSuccess'),
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      setError(err.message || t('auth.passwordResetFailed'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.description}>{t('auth.forgotPasswordDescription')}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOtp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.sendOtp')}</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.description}>{t('auth.otpDescription', { email })}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="key-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('auth.otpPlaceholder')}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
        <Text style={styles.buttonText}>{t('auth.verifyOtp')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendOtp}
        disabled={loading}
      >
        <Text style={styles.resendText}>{t('auth.resendOtp')}</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.description}>{t('auth.newPasswordDescription')}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('auth.newPasswordPlaceholder')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('auth.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.resetPassword')}</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={step === 1 ? 'lock-closed' : step === 2 ? 'key' : 'checkmark-circle'}
              size={40}
              color="#007AFF"
            />
          </View>
        </View>

        <Text style={styles.title}>
          {step === 1
            ? t('auth.forgotPassword')
            : step === 2
            ? t('auth.verifyOtp')
            : t('auth.setNewPassword')}
        </Text>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="arrow-back" size={16} color="#007AFF" />
          <Text style={styles.backToLoginText}>{t('auth.backToLogin')}</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  backToLoginText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default ForgotPasswordScreen;

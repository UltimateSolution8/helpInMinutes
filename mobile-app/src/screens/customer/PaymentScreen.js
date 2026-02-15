import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  processPaymentStart,
  processPaymentSuccess,
  processPaymentFailure,
  verifyPaymentStart,
  verifyPaymentSuccess,
  verifyPaymentFailure,
} from '../../store/slices/paymentSlice';
import { createOrder, verifyPayment, processCashPayment } from '../../services/paymentApi';
import LoadingOverlay from '../../components/LoadingOverlay';
import { formatCurrency } from '../../utils/formatters';

const PAYMENT_METHODS = [
  { id: 'ONLINE', name: 'Pay Online', icon: 'card', description: 'UPI, Cards, Net Banking' },
  { id: 'CASH', name: 'Cash Payment', icon: 'cash', description: 'Pay cash with OTP verification' },
];

const PaymentScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const { taskId, amount: initialAmount } = route.params || {};
  const { processing, verifying } = useSelector((state) => state.payment);
  
  const [selectedMethod, setSelectedMethod] = useState('ONLINE');
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleOnlinePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t('common.error'), t('payment.invalidAmount'));
      return;
    }

    dispatch(processPaymentStart());
    try {
      const orderData = await createOrder({
        taskId,
        amount: parseFloat(amount),
      });

      // Razorpay checkout would go here
      Alert.alert(t('common.comingSoon'), 'Razorpay integration pending');
      
    } catch (err) {
      dispatch(processPaymentFailure(err.message));
      Alert.alert(t('common.error'), err.message);
    }
  };

  const handleCashPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t('common.error'), t('payment.invalidAmount'));
      return;
    }

    dispatch(processPaymentStart());
    try {
      await processCashPayment({
        taskId,
        amount: parseFloat(amount),
      });
      
      setShowOtpInput(true);
      Alert.alert(t('payment.otpSent'), t('payment.otpSentToHelper'));
    } catch (err) {
      dispatch(processPaymentFailure(err.message));
      Alert.alert(t('common.error'), err.message);
    }
  };

  const verifyCashOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert(t('common.error'), t('payment.invalidOtp'));
      return;
    }

    dispatch(verifyPaymentStart());
    try {
      await verifyPayment({
        taskId,
        otp,
        paymentMethod: 'CASH',
      });
      
      dispatch(verifyPaymentSuccess());
      showSuccessAndNavigate();
    } catch (err) {
      dispatch(verifyPaymentFailure(err.message));
      Alert.alert(t('common.error'), err.message);
    }
  };

  const showSuccessAndNavigate = () => {
    Alert.alert(
      t('payment.success'),
      t('payment.thankYou'),
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('CustomerMain', { screen: 'Home' }),
        },
      ]
    );
  };

  const handleSubmit = () => {
    if (selectedMethod === 'ONLINE') {
      handleOnlinePayment();
    } else {
      if (showOtpInput) {
        verifyCashOtp();
      } else {
        handleCashPayment();
      }
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFD700' : '#ccc'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('payment.title')}</Text>
          <Text style={styles.subtitle}>{t('payment.subtitle')}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>{t('payment.amount')}</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              editable={!initialAmount}
            />
          </View>
        </View>

        {!showOtpInput && (
          <View style={styles.methodsContainer}>
            <Text style={styles.sectionTitle}>{t('payment.selectMethod')}</Text>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardSelected,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.methodIconContainer}>
                  <Ionicons
                    name={method.icon}
                    size={24}
                    color={selectedMethod === method.id ? '#007AFF' : '#666'}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text
                    style={[
                      styles.methodName,
                      selectedMethod === method.id && styles.methodNameSelected,
                    ]}
                  >
                    {method.name}
                  </Text>
                  <Text style={styles.methodDescription}>
                    {method.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedMethod === method.id && styles.radioButtonSelected,
                  ]}
                >
                  {selectedMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedMethod === 'CASH' && showOtpInput && (
          <View style={styles.otpContainer}>
            <Ionicons name="lock-closed" size={48} color="#007AFF" />
            <Text style={styles.otpTitle}>{t('payment.enterOtp')}</Text>
            <Text style={styles.otpSubtitle}>{t('payment.otpDescription')}</Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              textAlign="center"
            />
          </View>
        )}

        <View style={styles.ratingContainer}>
          <Text style={styles.sectionTitle}>{t('payment.rateService')}</Text>
          {renderStars()}
          <TextInput
            style={styles.reviewInput}
            value={review}
            onChangeText={setReview}
            placeholder={t('payment.reviewPlaceholder')}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.payButton, (processing || verifying) && styles.payButtonDisabled]}
          onPress={handleSubmit}
          disabled={processing || verifying}
        >
          <Text style={styles.payButtonText}>
            {processing
              ? t('payment.processing')
              : verifying
              ? t('payment.verifying')
              : selectedMethod === 'CASH' && showOtpInput
              ? t('payment.verifyOtp')
              : t('payment.payAmount', { amount: formatCurrency(amount || 0) })}
          </Text>
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color="#34C759" />
          <Text style={styles.securityText}>{t('payment.securePayment')}</Text>
        </View>
      </ScrollView>

      <LoadingOverlay visible={processing || verifying} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  amountContainer: {
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 12,
  },
  methodsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  methodNameSelected: {
    color: '#007AFF',
  },
  methodDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  otpContainer: {
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  otpInput: {
    width: 200,
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    letterSpacing: 8,
  },
  ratingContainer: {
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  reviewInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    height: 100,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  securityText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 6,
  },
});

export default PaymentScreen;

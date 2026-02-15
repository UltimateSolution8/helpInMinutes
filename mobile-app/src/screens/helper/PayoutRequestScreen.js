import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { requestPayout, fetchBankAccounts, fetchWalletBalance } from '../../store/slices/earningsSlice';

const PayoutRequestScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { balance, bankAccounts, loading } = useSelector((state) => state.earnings);
  
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [showAmountInput, setShowAmountInput] = useState(false);

  useEffect(() => {
    dispatch(fetchBankAccounts());
    dispatch(fetchWalletBalance());
  }, [dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const handleQuickAmount = (percent) => {
    const quickAmount = Math.floor(balance * percent);
    setAmount(quickAmount.toString());
  };

  const handleRequestPayout = async () => {
    if (!selectedBank) {
      Alert.alert(t('common.error'), t('payout.selectBank'));
      return;
    }

    const payoutAmount = parseFloat(amount);
    if (!payoutAmount || payoutAmount < 100) {
      Alert.alert(t('common.error'), t('payout.minAmountError'));
      return;
    }

    if (payoutAmount > balance) {
      Alert.alert(t('common.error'), t('payout.insufficientBalance'));
      return;
    }

    try {
      await dispatch(requestPayout({
        amount: payoutAmount,
        bankAccountId: selectedBank.id,
      })).unwrap();

      Alert.alert(
        t('payout.success'),
        t('payout.successMessage'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), error || t('payout.failedMessage'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('payout.availableBalance')}</Text>
        <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
      </View>

      {/* Quick Amount Selection */}
      {!showAmountInput ? (
        <View style={styles.quickAmountContainer}>
          <Text style={styles.sectionTitle}>{t('payout.selectAmount')}</Text>
          <View style={styles.quickAmountButtons}>
            {[0.25, 0.5, 0.75, 1].map((percent) => (
              <TouchableOpacity
                key={percent}
                style={styles.quickAmountButton}
                onPress={() => {
                  handleQuickAmount(percent);
                  setShowAmountInput(true);
                }}
              >
                <Text style={styles.quickAmountText}>{Math.round(percent * 100)}%</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.customAmountButton}
            onPress={() => setShowAmountInput(true)}
          >
            <Text style={styles.customAmountText}>{t('payout.customAmount')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.amountInputContainer}>
          <Text style={styles.sectionTitle}>{t('payout.enterAmount')}</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          <Text style={styles.remainingBalance}>
            {t('payout.remaining', { amount: formatCurrency(balance - (parseFloat(amount) || 0)) })}
          </Text>
          <TouchableOpacity
            style={styles.changeAmountButton}
            onPress={() => {
              setAmount('');
              setShowAmountInput(false);
            }}
          >
            <Text style={styles.changeAmountText}>{t('payout.changeAmount')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bank Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('payout.selectBankAccount')}</Text>
        {bankAccounts.length > 0 ? (
          bankAccounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.bankCard,
                selectedBank?.id === account.id && styles.bankCardSelected,
              ]}
              onPress={() => setSelectedBank(account)}
            >
              <View style={styles.bankRadio}>
                {selectedBank?.id === account.id ? (
                  <View style={styles.radioSelected} />
                ) : (
                  <View style={styles.radioUnselected} />
                )}
              </View>
              <Ionicons name="business" size={24} color="#007AFF" />
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{account.bankName}</Text>
                <Text style={styles.accountNumber}>
                  {t('payout.accountEnding', { number: account.accountNumber?.slice(-4) })}
                </Text>
                <Text style={styles.accountHolder}>{account.accountHolderName}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBankCard}>
            <Text style={styles.emptyBankText}>{t('payout.noBankAccounts')}</Text>
            <TouchableOpacity style={styles.addBankButton}>
              <Text style={styles.addBankButtonText}>{t('payout.addBank')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Payout Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          {t('payout.processingTime')}
        </Text>
      </View>

      {/* Request Button */}
      <TouchableOpacity
        style={[
          styles.requestButton,
          (!selectedBank || !amount || parseFloat(amount) < 100) && styles.requestButtonDisabled,
        ]}
        onPress={handleRequestPayout}
        disabled={!selectedBank || !amount || parseFloat(amount) < 100 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.requestButtonText}>
            {t('payout.requestPayout')}
          </Text>
        )}
      </TouchableOpacity>
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
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickAmountContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  customAmountButton: {
    alignItems: 'center',
    padding: 12,
  },
  customAmountText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  amountInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingVertical: 8,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
  },
  remainingBalance: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  changeAmountButton: {
    alignItems: 'center',
    padding: 12,
  },
  changeAmountText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bankCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  bankRadio: {
    marginRight: 12,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  bankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  accountNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  accountHolder: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyBankCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyBankText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  addBankButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBankButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  requestButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PayoutRequestScreen;

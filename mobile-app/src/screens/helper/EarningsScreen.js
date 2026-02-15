import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchWalletBalance,
  fetchEarningsSummary,
  fetchTransactions,
  fetchBankAccounts,
} from '../../store/slices/earningsSlice';

const EarningsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { balance, dailyEarnings, weeklyEarnings, monthlyEarnings, transactions, bankAccounts } = useSelector(
    (state) => state.earnings
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('WEEK');

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = () => {
    dispatch(fetchWalletBalance());
    dispatch(fetchEarningsSummary('WEEK'));
    dispatch(fetchTransactions({ page: 0, size: 10 }));
    dispatch(fetchBankAccounts());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'TASK_COMPLETED':
        return 'checkmark-circle';
      case 'PAYOUT':
        return 'wallet';
      case 'BONUS':
        return 'gift';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'TASK_COMPLETED':
      case 'BONUS':
        return '#4CAF50';
      case 'PAYOUT':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('earnings.availableBalance')}</Text>
        <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => navigation.navigate('PayoutRequest')}
        >
          <Text style={styles.withdrawButtonText}>{t('earnings.withdraw')}</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Summary */}
      <View style={styles.summaryContainer}>
        <TouchableOpacity
          style={[summaryItem, selectedPeriod === 'DAY' && summaryItemActive]}
          onPress={() => setSelectedPeriod('DAY')}
        >
          <Text style={[summaryItemLabel, selectedPeriod === 'DAY' && summaryItemLabelActive]}>
            {t('earnings.today')}
          </Text>
          <Text style={[summaryItemValue, selectedPeriod === 'DAY' && summaryItemValueActive]}>
            {formatCurrency(dailyEarnings)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[summaryItem, selectedPeriod === 'WEEK' && summaryItemActive]}
          onPress={() => setSelectedPeriod('WEEK')}
        >
          <Text style={[summaryItemLabel, selectedPeriod === 'WEEK' && summaryItemLabelActive]}>
            {t('earnings.thisWeek')}
          </Text>
          <Text style={[summaryItemValue, selectedPeriod === 'WEEK' && summaryItemValueActive]}>
            {formatCurrency(weeklyEarnings)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[summaryItem, selectedPeriod === 'MONTH' && summaryItemActive]}
          onPress={() => setSelectedPeriod('MONTH')}
        >
          <Text style={[summaryItemLabel, selectedPeriod === 'MONTH' && summaryItemLabelActive]}>
            {t('earnings.thisMonth')}
          </Text>
          <Text style={[summaryItemValue, selectedPeriod === 'MONTH' && summaryItemValueActive]}>
            {formatCurrency(monthlyEarnings)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bank Accounts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('earnings.bankAccounts')}</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>{t('earnings.addNew')}</Text>
          </TouchableOpacity>
        </View>
        {bankAccounts.length > 0 ? (
          bankAccounts.map((account, index) => (
            <View key={index} style={styles.bankCard}>
              <Ionicons name="business" size={24} color="#007AFF" />
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{account.bankName}</Text>
                <Text style={styles.accountNumber}>
                  {t('earnings.accountEnding', { number: account.accountNumber?.slice(-4) })}
                </Text>
              </View>
              {account.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>{t('earnings.default')}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('earnings.noBankAccounts')}</Text>
          </View>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('earnings.recentTransactions')}</Text>
        {transactions.length > 0 ? (
          transactions.map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.type) + '20' }]}>
                <Ionicons name={getTransactionIcon(transaction.type)} size={20} color={getTransactionColor(transaction.type)} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>
                  {transaction.type === 'TASK_COMPLETED' ? t('earnings.taskCompleted') : transaction.type}
                </Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
              </View>
              <Text style={[styles.transactionAmount, { color: transaction.amount > 0 ? '#4CAF50' : '#D32F2F' }]}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('earnings.noTransactions')}</Text>
          </View>
        )}
      </View>
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
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  withdrawButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItemActive: {
    backgroundColor: '#007AFF',
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryItemLabelActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryItemValueActive: {
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: 14,
    color: '#007AFF',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
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
  defaultBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EarningsScreen;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

const PayoutMethodCard = ({ bankAccount, isDefault, onPress, onSetDefault }) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.container, isDefault && styles.containerSelected]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="business" size={24} color="#007AFF" />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.bankName}>{bankAccount.bankName}</Text>
        <Text style={styles.accountNumber}>
          {t('payout.accountEnding', { number: bankAccount.accountNumber?.slice(-4) })}
        </Text>
        <Text style={styles.accountHolder}>{bankAccount.accountHolderName}</Text>
      </View>

      <View style={styles.rightContainer}>
        {isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>{t('payout.default')}</Text>
          </View>
        )}
        {!isDefault && onSetDefault && (
          <TouchableOpacity style={styles.setDefaultButton} onPress={onSetDefault}>
            <Text style={styles.setDefaultText}>{t('payout.setDefault')}</Text>
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  accountNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  accountHolder: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  setDefaultButton: {
    marginBottom: 8,
  },
  setDefaultText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default PayoutMethodCard;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EarningsCard = ({ title, amount, icon, color }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount}>{formatCurrency(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
});

export default EarningsCard;

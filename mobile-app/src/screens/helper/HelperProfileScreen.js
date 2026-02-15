import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../../store/slices/helperAuthSlice';
import { updateOnlineStatus } from '../../store/slices/helperAuthSlice';

const HelperProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, isOnline, kycStatus } = useSelector((state) => state.helperAuth);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const handleToggleOnline = () => {
    dispatch(updateOnlineStatus(!isOnline));
  };

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return '#4CAF50';
      case 'UNDER_REVIEW':
        return '#FF9800';
      case 'REJECTED':
        return '#D32F2F';
      default:
        return '#999';
    }
  };

  const getKycStatusText = (status) => {
    switch (status) {
      case 'VERIFIED':
        return t('profile.kyc.verified');
      case 'UNDER_REVIEW':
        return t('profile.kyc.pending');
      case 'REJECTED':
        return t('profile.kyc.rejected');
      default:
        return t('profile.kyc.notSubmitted');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0) || 'H'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.fullName || 'Helper'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={[styles.kycBadge, { backgroundColor: getKycStatusColor(kycStatus) + '20' }]}>
          <Text style={[styles.kycBadgeText, { color: getKycStatusColor(kycStatus) }]}>
            {getKycStatusText(kycStatus)}
          </Text>
        </View>
      </View>

      {/* Online Status Toggle */}
      <View style={styles.statusCard}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>
            {isOnline ? t('profile.online') : t('profile.offline')}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isOnline ? t('profile.receivingTasks') : t('profile.notReceivingTasks')}
          </Text>
        </View>
        <Switch
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor="#fff"
          onValueChange={handleToggleOnline}
          value={isOnline}
        />
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Schedule')}
        >
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.scheduleAvailability')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.documents')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="wallet" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.bankAccounts')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
        
        <View style={styles.menuItem}>
          <Ionicons name="notifications" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.notifications')}</Text>
          <Switch
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor="#fff"
            onValueChange={setNotificationsEnabled}
            value={notificationsEnabled}
          />
        </View>

        <View style={styles.menuItem}>
          <Ionicons name="location" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.locationServices')}</Text>
          <Switch
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor="#fff"
            onValueChange={setLocationEnabled}
            value={locationEnabled}
          />
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="language" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.language')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.helpSupport')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.termsOfService')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="lock-closed" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.privacyPolicy')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>{t('profile.appVersion')}</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="#D32F2F" />
        <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
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
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  kycBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kycBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginLeft: 8,
  },
});

export default HelperProfileScreen;

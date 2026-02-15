import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../store/slices/authSlice';

const SettingsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user } = useSelector((state) => state.auth);

  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    newMessages: true,
    promotions: false,
    pushEnabled: true,
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    locationEnabled: true,
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
            Alert.alert('Account Deletion', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePreference = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Push Notifications',
          value: notifications.pushEnabled,
          onValueChange: () => toggleNotification('pushEnabled'),
          type: 'switch',
        },
        {
          icon: 'hourglass-outline',
          title: 'Task Updates',
          subtitle: 'Get notified about task status changes',
          value: notifications.taskUpdates,
          onValueChange: () => toggleNotification('taskUpdates'),
          type: 'switch',
        },
        {
          icon: 'chatbubble-outline',
          title: 'New Messages',
          subtitle: 'Get notified when you receive new messages',
          value: notifications.newMessages,
          onValueChange: () => toggleNotification('newMessages'),
          type: 'switch',
        },
        {
          icon: 'pricetags-outline',
          title: 'Promotions & Offers',
          subtitle: 'Receive promotional messages and offers',
          value: notifications.promotions,
          onValueChange: () => toggleNotification('promotions'),
          type: 'switch',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon-outline',
          title: 'Dark Mode',
          subtitle: 'Switch between light and dark themes',
          value: preferences.darkMode,
          onValueChange: () => togglePreference('darkMode'),
          type: 'switch',
        },
        {
          icon: 'location-outline',
          title: 'Location Services',
          subtitle: 'Allow app to access your location',
          value: preferences.locationEnabled,
          onValueChange: () => togglePreference('locationEnabled'),
          type: 'switch',
        },
        {
          icon: 'language-outline',
          title: 'Language',
          subtitle: 'English',
          onPress: () => navigation.navigate('Language'),
          type: 'navigation',
        },
        {
          icon: 'card-outline',
          title: 'Payment Methods',
          subtitle: 'Manage your payment options',
          onPress: () => navigation.navigate('PaymentMethods'),
          type: 'navigation',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help Center',
          subtitle: 'FAQs and support information',
          onPress: () => navigation.navigate('Help'),
          type: 'navigation',
        },
        {
          icon: 'mail-outline',
          title: 'Contact Us',
          subtitle: 'helpinminutes@gmail.com',
          onPress: () => {
            Linking.openURL('mailto:helpinminutes@gmail.com');
          },
          type: 'navigation',
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          onPress: () => navigation.navigate('Terms'),
          type: 'navigation',
        },
        {
          icon: 'shield-outline',
          title: 'Privacy Policy',
          onPress: () => navigation.navigate('Privacy'),
          type: 'navigation',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'lock-closed-outline',
          title: 'Change Password',
          onPress: () => navigation.navigate('ChangePassword'),
          type: 'navigation',
        },
        {
          icon: 'trash-outline',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          onPress: handleDeleteAccount,
          type: 'destructive',
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <View style={styles.appIcon}>
          <Text style={styles.appIconText}>H</Text>
        </View>
        <Text style={styles.appName}>HelpInMinutes</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[styles.settingItem, itemIndex !== section.items.length - 1 && styles.settingItemBorder]}
                onPress={item.onPress}
                disabled={item.type === 'switch' || !item.onPress}
                activeOpacity={item.type === 'switch' || !item.onPress ? 1 : 0.7}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={item.type === 'destructive' ? '#FF3B30' : '#007AFF'}
                  />
                  <View style={styles.settingItemText}>
                    <Text
                      style={[styles.settingItemTitle, item.type === 'destructive' && styles.destructiveText]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.settingItemRight}>
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                      thumbColor="#FFF"
                    />
                  )}
                  {item.type === 'navigation' && !item.value && (
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  )}
                  {item.type === 'navigation' && item.value && (
                    <Text style={styles.settingItemValue}>{item.value}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Footer Spacing */}
      <View style={styles.footerSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  appVersion: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    color: '#000',
  },
  settingItemSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  settingItemRight: {
    marginLeft: 12,
  },
  settingItemValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  footerSpacing: {
    height: 40,
  },
});

export default SettingsScreen;

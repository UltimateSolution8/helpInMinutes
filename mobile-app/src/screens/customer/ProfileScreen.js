import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { logout, updateProfile } from '../../store/slices/authSlice';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user, loading } = useSelector((state) => state.auth);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (user?.profileImage) {
      setProfileImage(user.profileImage);
    }
  }, [user]);

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

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photo library to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
      // Dispatch update profile action here
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const menuItems = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', title: 'Edit Profile', onPress: handleEditProfile },
        { icon: 'lock-closed-outline', title: 'Change Password', onPress: handleChangePassword },
        { icon: 'notifications-outline', title: 'Notifications', onPress: () => navigation.navigate('NotificationSettings') },
        { icon: 'location-outline', title: 'Saved Addresses', onPress: () => navigation.navigate('SavedAddresses') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'language-outline', title: 'Language', onPress: () => navigation.navigate('Language') },
        { icon: 'moon-outline', title: 'Dark Mode', onPress: () => navigation.navigate('Theme') },
        { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => navigation.navigate('Help') },
        { icon: 'document-text-outline', title: 'Terms & Conditions', onPress: () => navigation.navigate('Terms') },
        { icon: 'shield-outline', title: 'Privacy Policy', onPress: () => navigation.navigate('Privacy') },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle-outline', title: 'App Version', onPress: () => {}, value: '1.0.0' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleSelectImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(user?.firstName, user?.lastName)}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.completedTasks || 0}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.rating?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.yearsOnPlatform || 0}</Text>
          <Text style={styles.statLabel}>Years</Text>
        </View>
      </View>

      {/* Menu Items */}
      {menuItems.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.menuItem,
                  itemIndex !== section.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={22} color="#007AFF" />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.value && <Text style={styles.menuItemValue}>{item.value}</Text>}
                  {!item.value && <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />}
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 4,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#8E8E93',
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

export default ProfileScreen;

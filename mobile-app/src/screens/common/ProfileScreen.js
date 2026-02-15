import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Avatar,
  Text,
  Card,
  List,
  Divider,
  Button,
  Dialog,
  Portal,
  TextInput,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

import { fetchUserProfile, updateProfile, updateAvatar } from '../../store/slices/userSlice';
import { logout } from '../../store/slices/authSlice';
import LoadingOverlay from '../../components/common/LoadingOverlay';

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.user);
  const { user: authUser } = useSelector((state) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    phoneNumber: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      await dispatch(fetchUserProfile()).unwrap();
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('profile.galleryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await dispatch(updateAvatar(result.assets[0].uri)).unwrap();
        Alert.alert(t('common.success'), t('profile.avatarUpdated'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.avatarUpdateFailed'));
    }
  };

  const openEditDialog = () => {
    setEditedProfile({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
    });
    setEditDialogVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      await dispatch(updateProfile(editedProfile)).unwrap();
      setEditDialogVisible(false);
      Alert.alert(t('common.success'), t('profile.updateSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('profile.updateFailed'));
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading && !user) {
    return <LoadingOverlay message={t('profile.loading')} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={100}
            source={user?.avatarUrl ? { uri: user.avatarUrl } : null}
            style={styles.avatar}
          />
          {!user?.avatarUrl && (
            <Avatar.Text
              size={100}
              label={getInitials(user?.name)}
              style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
              labelStyle={{ fontSize: 32, color: theme.colors.primary }}
            />
          )}
          <IconButton
            icon="camera"
            size={20}
            style={styles.cameraButton}
            onPress={pickImage}
          />
        </View>
        <Text style={[styles.userName, { color: theme.colors.onPrimary }]}>
          {user?.name || t('profile.guest')}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.onPrimary }]}
          accessibilityLabel={`${t('profile.email')}: ${user?.email}`}>
          {user?.email}
        </Text>
      </View>

      {/* Stats Section */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {user?.totalTasks || 0}
            </Text>
            <Text style={styles.statLabel}>{t('profile.tasksCompleted')}</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {user?.memberSince ? new Date(user.memberSince).getFullYear() : '-'}
            </Text>
            <Text style={styles.statLabel}>{t('profile.memberSince')}</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {user?.rating?.toFixed(1) || '5.0'}
            </Text>
            <Text style={styles.statLabel}>{t('profile.rating')}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Profile Actions */}
      <Card style={styles.card}>
        <List.Section>
          <List.Subheader>{t('profile.accountSettings')}</List.Subheader>
          <List.Item
            title={t('profile.editProfile')}
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            onPress={openEditDialog}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title={t('profile.changePassword')}
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            onPress={() => navigation.navigate('ChangePassword')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title={t('profile.savedAddresses')}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            onPress={() => navigation.navigate('SavedAddresses')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>
      </Card>

      {/* Preferences */}
      <Card style={styles.card}>
        <List.Section>
          <List.Subheader>{t('profile.preferences')}</List.Subheader>
          <List.Item
            title={t('profile.notifications')}
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            onPress={() => navigation.navigate('NotificationSettings')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title={t('profile.language')}
            left={(props) => <List.Icon {...props} icon="translate" />}
            onPress={() => navigation.navigate('LanguageSettings')}
            description={t(`languages.${authUser?.language || 'en'}`)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title={t('profile.privacy')}
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={() => navigation.navigate('PrivacySettings')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>
      </Card>

      {/* Support */}
      <Card style={styles.card}>
        <List.Section>
          <List.Subheader>{t('profile.support')}</List.Subheader>
          <List.Item
            title={t('profile.helpCenter')}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => navigation.navigate('HelpCenter')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title={t('profile.contactUs')}
            left={(props) => <List.Icon {...props} icon="message-text" />}
            onPress={() => navigation.navigate('ContactUs')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title={t('profile.about')}
            left={(props) => <List.Icon {...props} icon="information" />}
            onPress={() => navigation.navigate('About')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>
      </Card>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={[styles.logoutButton, { borderColor: theme.colors.error }]}
        textColor={theme.colors.error}
        icon="logout"
      >
        {t('profile.logout')}
      </Button>

      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>{t('profile.editProfile')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('profile.name')}
              value={editedProfile.name}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label={t('profile.phoneNumber')}
              value={editedProfile.phoneNumber}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, phoneNumber: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleUpdateProfile} loading={loading}>
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: 'white',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    margin: 0,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.9,
  },
  statsCard: {
    margin: 16,
    marginTop: -20,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    height: '80%',
    alignSelf: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 8,
  },
  input: {
    marginBottom: 12,
  },
});

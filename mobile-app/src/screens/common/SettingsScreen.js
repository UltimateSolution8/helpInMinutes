import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  List,
  Switch,
  Divider,
  Text,
  useTheme,
  Button,
  Portal,
  Dialog,
  RadioButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { updateLanguage, toggleNotifications, updatePrivacySettings } from '../../store/slices/userSlice';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
];

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { settings, language } = useSelector((state) => state.user);
  
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false);

  const handleLanguageChange = async (langCode) => {
    try {
      await i18n.changeLanguage(langCode);
      await dispatch(updateLanguage(langCode)).unwrap();
      setLanguageDialogVisible(false);
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const handleNotificationToggle = (type) => {
    dispatch(toggleNotifications(type));
  };

  const handlePrivacyToggle = (setting) => {
    dispatch(updatePrivacySettings({ [setting]: !settings.privacy?.[setting] }));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Notifications Section */}
      <List.Section>
        <List.Subheader>{t('settings.notifications')}</List.Subheader>
        <List.Item
          title={t('settings.pushNotifications')}
          right={() => (
            <Switch
              value={settings.notifications?.push}
              onValueChange={() => handleNotificationToggle('push')}
            />
          )}
        />
        <Divider />
        <List.Item
          title={t('settings.emailNotifications')}
          right={() => (
            <Switch
              value={settings.notifications?.email}
              onValueChange={() => handleNotificationToggle('email')}
            />
          )}
        />
        <Divider />
        <List.Item
          title={t('settings.smsNotifications')}
          right={() => (
            <Switch
              value={settings.notifications?.sms}
              onValueChange={() => handleNotificationToggle('sms')}
            />
          )}
        />
      </List.Section>

      {/* Language Section */}
      <List.Section>
        <List.Subheader>{t('settings.language')}</List.Subheader>
        <List.Item
          title={t('settings.selectLanguage')}
          description={LANGUAGES.find(l => l.code === language)?.name || 'English'}
          onPress={() => setLanguageDialogVisible(true)}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      {/* Privacy Section */}
      <List.Section>
        <List.Subheader>{t('settings.privacy')}</List.Subheader>
        <List.Item
          title={t('settings.locationSharing')}
          description={t('settings.locationSharingDesc')}
          right={() => (
            <Switch
              value={settings.privacy?.shareLocation}
              onValueChange={() => handlePrivacyToggle('shareLocation')}
            />
          )}
        />
        <Divider />
        <List.Item
          title={t('settings.showProfile')}
          description={t('settings.showProfileDesc')}
          right={() => (
            <Switch
              value={settings.privacy?.showProfile}
              onValueChange={() => handlePrivacyToggle('showProfile')}
            />
          )}
        />
      </List.Section>

      {/* App Settings */}
      <List.Section>
        <List.Subheader>{t('settings.appSettings')}</List.Subheader>
        <List.Item
          title={t('settings.darkMode')}
          description={t('settings.darkModeDesc')}
          right={() => (
            <Switch
              value={theme.dark}
              disabled={true} // Controlled by system for now
            />
          )}
        />
        <Divider />
        <List.Item
          title={t('settings.autoPlayMedia')}
          right={() => (
            <Switch
              value={settings.autoPlayMedia}
              onValueChange={(value) => dispatch({ type: 'user/updateSettings', payload: { autoPlayMedia: value } })}
            />
          )}
        />
      </List.Section>

      {/* About */}
      <List.Section>
        <List.Subheader>{t('settings.about')}</List.Subheader>
        <List.Item
          title={t('settings.version')}
          description="1.0.0 (Build 100)"
        />
        <Divider />
        <List.Item
          title={t('settings.termsOfService')}
          onPress={() => navigation.navigate('TermsOfService')}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title={t('settings.privacyPolicy')}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      {/* Language Selection Dialog */}
      <Portal>
        <Dialog visible={languageDialogVisible} onDismiss={() => setLanguageDialogVisible(false)}>
          <Dialog.Title>{t('settings.selectLanguage')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={handleLanguageChange} value={language || 'en'}>
              {LANGUAGES.map((lang) => (
                <RadioButton.Item
                  key={lang.code}
                  label={lang.name}
                  value={lang.code}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLanguageDialogVisible(false)}>
              {t('common.cancel')}
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
});
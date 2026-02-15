import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchKycStatus } from '../../store/slices/kycSlice';

const KycPendingScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { kycStatus } = useSelector((state) => state.helperAuth);

  const spinValue = new Animated.Value(0);

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    // Poll KYC status every 10 seconds
    const interval = setInterval(() => {
      dispatch(fetchKycStatus());
    }, 10000);

    return () => {
      rotateAnimation.stop();
      clearInterval(interval);
    };
  }, [dispatch]);

  useEffect(() => {
    if (kycStatus === 'VERIFIED') {
      navigation.replace('HelperMain');
    }
  }, [kycStatus, navigation]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderContent = () => {
    switch (kycStatus) {
      case 'UNDER_REVIEW':
        return (
          <>
            <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]}>
              <Ionicons name="hourglass" size={48} color="#007AFF" />
            </Animated.View>
            <Text style={styles.title}>{t('kyc.pending.title')}</Text>
            <Text style={styles.subtitle}>{t('kyc.pending.reviewMessage')}</Text>
            <Text style={styles.note}>{t('kyc.pending.note')}</Text>
          </>
        );
      case 'REJECTED':
        return (
          <>
            <View style={styles.errorIcon}>
              <Ionicons name="close-circle" size={64} color="#D32F2F" />
            </View>
            <Text style={styles.title}>{t('kyc.rejected.title')}</Text>
            <Text style={styles.subtitle}>{t('kyc.rejected.subtitle')}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('KycUpload')}
            >
              <Text style={styles.buttonText}>{t('kyc.reupload')}</Text>
            </TouchableOpacity>
          </>
        );
      default:
        return (
          <>
            <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]}>
              <Ionicons name="time" size={48} color="#FF9800" />
            </Animated.View>
            <Text style={styles.title}>{t('kyc.pending.title')}</Text>
            <Text style={styles.subtitle}>{t('kyc.pending.message')}</Text>
            <Text style={styles.note}>{t('kyc.pending.autoCheck')}</Text>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loader: {
    marginBottom: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  note: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default KycPendingScreen;

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import OnlineToggle from '../../components/OnlineToggle';
import EarningsCard from '../../components/EarningsCard';
import TaskAlertOverlay from '../../components/TaskAlertOverlay';
import SafetyButton from '../../components/SafetyButton';
import { fetchTaskCounts } from '../../store/slices/helperTaskSlice';
import { fetchEarningsSummary } from '../../store/slices/earningsSlice';

const HelperHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, isOnline } = useSelector((state) => state.helperAuth);
  const { taskCount, activeTask, taskAlert } = useSelector((state) => state.helperTask);
  const { dailyEarnings, weeklyEarnings } = useSelector((state) => state.earnings);

  useEffect(() => {
    if (isOnline) {
      dispatch(fetchTaskCounts());
      dispatch(fetchEarningsSummary('WEEK'));
    }
  }, [dispatch, isOnline]);

  const navigateToTask = () => {
    if (activeTask) {
      navigation.navigate('TaskFlow', { screen: 'TaskProgress' });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t('helper.home.greeting', { name: user?.fullName?.split(' ')[0] || 'Helper' })}
            </Text>
            <Text style={styles.statusText}>
              {isOnline ? t('helper.home.online') : t('helper.home.offline')}
            </Text>
          </View>
          <SafetyButton />
        </View>

        {/* Online Toggle */}
        <OnlineToggle />

        {/* Active Task Banner */}
        {activeTask && (
          <TouchableOpacity style={styles.activeTaskBanner} onPress={navigateToTask}>
            <View style={styles.activeTaskIcon}>
              <Ionicons name="briefcase" size={24} color="#fff" />
            </View>
            <View style={styles.activeTaskInfo}>
              <Text style={styles.activeTaskTitle}>{t('helper.home.activeTask')}</Text>
              <Text style={styles.activeTaskSubtitle}>
                {t('helper.home.taskInProgress')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}

        {/* Earnings Summary */}
        <Text style={styles.sectionTitle}>{t('helper.home.earnings')}</Text>
        <View style={styles.earningsContainer}>
          <EarningsCard
            title={t('helper.home.today')}
            amount={dailyEarnings}
            icon="calendar"
            color="#4CAF50"
          />
          <EarningsCard
            title={t('helper.home.thisWeek')}
            amount={weeklyEarnings}
            icon="chart"
            color="#2196F3"
          />
        </View>

        {/* Task Stats */}
        <Text style={styles.sectionTitle}>{t('helper.home.tasks')}</Text>
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardPrimary]}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.statNumber}>{taskCount.pending || 0}</Text>
            <Text style={styles.statLabel}>{t('helper.home.pending')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.statNumber}>{taskCount.inProgress || 0}</Text>
            <Text style={styles.statLabel}>{t('helper.home.inProgress')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.statNumber}>{taskCount.completed || 0}</Text>
            <Text style={styles.statLabel}>{t('helper.home.completed')}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('helper.home.quickActions')}</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Schedule')}
          >
            <Ionicons name="calendar" size={28} color="#007AFF" />
            <Text style={styles.quickActionText}>{t('helper.home.schedule')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Ionicons name="wallet" size={28} color="#4CAF50" />
            <Text style={styles.quickActionText}>{t('helper.home.earnings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={28} color="#9C27B0" />
            <Text style={styles.quickActionText}>{t('helper.home.profile')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="time" size={28} color="#FF9800" />
            <Text style={styles.quickActionText}>{t('helper.home.history')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Task Alert Overlay */}
      {taskAlert && <TaskAlertOverlay task={taskAlert} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  activeTaskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activeTaskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeTaskInfo: {
    flex: 1,
  },
  activeTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activeTaskSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
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
  statCardPrimary: {
    backgroundColor: '#007AFF',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
});

export default HelperHomeScreen;

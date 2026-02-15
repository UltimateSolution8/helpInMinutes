import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { setTaskAlert, clearTaskAlert, setActiveTask } from '../store/slices/helperTaskSlice';
import socketService from './socketService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const requestNotificationPermission = async () => {
  if (!Device.isDevice) {
    console.log('Notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

// Configure local notifications
export const configureNotifications = () => {
  // Set categories for notification actions
  Notifications.setNotificationCategoryAsync('TASK_ALERT', [
    {
      identifier: 'ACCEPT_TASK',
      buttonTitle: 'Accept',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'DECLINE_TASK',
      buttonTitle: 'Decline',
      options: { opensAppToForeground: true, destructive: true },
    },
  ]);

  // Set notification response handler
  Notifications.addNotificationResponseReceivedListener((response) => {
    const { actionIdentifier, notification } = response;
    
    if (actionIdentifier === 'ACCEPT_TASK') {
      handleAcceptNotification(notification);
    } else if (actionIdentifier === 'DECLINE_TASK') {
      handleDeclineNotification(notification);
    }
  });
};

// Show task alert notification
export const showTaskAlertNotification = async (task) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('Notification permission not granted');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Task Available! 🚀',
      body: `${task.taskType} - ₹${task.estimatedEarnings || task.amount}`,
      data: {
        taskId: task.id,
        taskType: 'TASK_ALERT',
      },
      categoryIdentifier: 'TASK_ALERT',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      sound: 'default',
      vibrate: [0, 250, 250, 250],
    },
    trigger: null, // Show immediately
  });
};

// Cancel task alert notification
export const cancelTaskAlertNotification = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Handle accept action from notification
const handleAcceptNotification = (notification) => {
  // The actual accept logic will be handled by the socket event
  console.log('Task accepted from notification:', notification.request.content.data.taskId);
};

// Handle decline action from notification
const handleDeclineNotification = (notification) => {
  console.log('Task declined from notification:', notification.request.content.data.taskId);
};

// Show countdown notification for task alert
export const showCountdownNotification = async (task, countdownSeconds) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Expiring Soon!',
      body: `${countdownSeconds} seconds left to accept the task`,
      data: {
        taskId: task.id,
        taskType: 'TASK_COUNTDOWN',
      },
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
};

// Show task started notification
export const showTaskStartedNotification = async (task) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Started!',
      body: `Head to ${task.destinationAddress || 'the task location'}`,
      data: {
        taskId: task.id,
        taskType: 'TASK_STARTED',
      },
      sound: 'default',
    },
    trigger: null,
  });
};

// Show task completed notification
export const showTaskCompletedNotification = async (earnings) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Completed! 🎉',
      body: `You earned ₹${earnings}`,
      data: {
        taskType: 'TASK_COMPLETED',
      },
      sound: 'default',
    },
    trigger: null,
  });
};

// Show payout notification
export const showPayoutNotification = async (amount) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Payout Processed! 💰',
      body: `₹${amount} has been transferred to your bank account`,
      data: {
        taskType: 'PAYOUT_COMPLETED',
      },
      sound: 'default',
    },
    trigger: null,
  });
};

// React hook for task alert handling
export const useTaskAlertHandler = () => {
  const dispatch = useDispatch();
  const { isOnline } = useSelector((state) => state.helperAuth);
  const taskAlertRef = useRef(null);

  const handleNewTask = useCallback((task) => {
    if (!isOnline) return;

    dispatch(setTaskAlert(task));
    taskAlertRef.current = task;
    
    // Show notification
    showTaskAlertNotification(task);
  }, [dispatch, isOnline]);

  const handleTaskCancelled = useCallback((data) => {
    if (taskAlertRef.current?.id === data.taskId) {
      dispatch(clearTaskAlert());
      taskAlertRef.current = null;
      cancelTaskAlertNotification();
    }
  }, [dispatch]);

  const handleTaskAccepted = useCallback((task) => {
    dispatch(setActiveTask(task));
    dispatch(clearTaskAlert());
    taskAlertRef.current = null;
    cancelTaskAlertNotification();
  }, [dispatch]);

  const clearAlert = useCallback(() => {
    dispatch(clearTaskAlert());
    taskAlertRef.current = null;
    cancelTaskAlertNotification();
  }, [dispatch]);

  useEffect(() => {
    configureNotifications();
  }, []);

  return {
    handleNewTask,
    handleTaskCancelled,
    handleTaskAccepted,
    clearAlert,
    currentTaskAlert: taskAlertRef.current,
  };
};

export default {
  requestNotificationPermission,
  configureNotifications,
  showTaskAlertNotification,
  cancelTaskAlertNotification,
  showCountdownNotification,
  showTaskStartedNotification,
  showTaskCompletedNotification,
  showPayoutNotification,
  useTaskAlertHandler,
};

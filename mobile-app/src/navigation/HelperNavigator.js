import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Helper Auth Screens
import HelperLoginScreen from '../screens/helper/HelperLoginScreen';
import HelperRegistrationScreen from '../screens/helper/HelperRegistrationScreen';
import KycUploadScreen from '../screens/helper/KycUploadScreen';
import KycPendingScreen from '../screens/helper/KycPendingScreen';

// Helper Main Screens
import HelperHomeScreen from '../screens/helper/HelperHomeScreen';
import EarningsScreen from '../screens/helper/EarningsScreen';
import PayoutRequestScreen from '../screens/helper/PayoutRequestScreen';
import HelperProfileScreen from '../screens/helper/HelperProfileScreen';
import ScheduleScreen from '../screens/helper/ScheduleScreen';

// Helper Task Screens
import TaskAlertScreen from '../screens/helper/TaskAlertScreen';
import TaskNavigationScreen from '../screens/helper/TaskNavigationScreen';
import TaskProgressScreen from '../screens/helper/TaskProgressScreen';
import TaskHistoryScreen from '../screens/helper/TaskHistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ================== Helper Auth Navigator ==================
export function HelperAuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HelperLogin" component={HelperLoginScreen} />
      <Stack.Screen name="HelperRegistration" component={HelperRegistrationScreen} />
      <Stack.Screen 
        name="KycUpload" 
        component={KycUploadScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen 
        name="KycPending" 
        component={KycPendingScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ================== Helper Task Navigator ==================
export function HelperTaskNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="TaskAlert" 
        component={TaskAlertScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen 
        name="TaskNavigation" 
        component={TaskNavigationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TaskProgress" 
        component={TaskProgressScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ================== Helper Main Tab Navigator ==================
export function HelperMainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HelperHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Earnings" 
        component={EarningsScreen}
        options={{ title: 'Earnings' }}
      />
      <Tab.Screen 
        name="History" 
        component={TaskHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={HelperProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ================== Helper Stack Navigator (for nested navigation) ==================
export function HelperStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HelperMain" component={HelperMainTabNavigator} />
      <Stack.Screen name="PayoutRequest" component={PayoutRequestScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="TaskFlow" component={HelperTaskNavigator} />
      <Stack.Screen 
        name="KycUploadScreen" 
        component={KycUploadScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

export default {
  HelperAuthNavigator,
  HelperTaskNavigator,
  HelperMainTabNavigator,
  HelperStackNavigator,
};

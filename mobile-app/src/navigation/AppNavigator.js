import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Customer Screens
import HomeScreen from '../screens/customer/HomeScreen';
import CreateTaskScreen from '../screens/customer/CreateTaskScreen';
import TaskMatchingScreen from '../screens/customer/TaskMatchingScreen';
import TaskTrackingScreen from '../screens/customer/TaskTrackingScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import TaskHistoryScreen from '../screens/customer/TaskHistoryScreen';
import TaskDetailScreen from '../screens/customer/TaskDetailScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import SettingsScreen from '../screens/customer/SettingsScreen';

// Common Screens
import ChatScreen from '../screens/common/ChatScreen';

// Helper Auth Navigator
import { HelperAuthNavigator, HelperStackNavigator } from './HelperNavigator';

// Helper Screens (direct imports for main navigator)
import HelperHomeScreen from '../screens/helper/HelperHomeScreen';
import HelperTasksScreen from '../screens/helper/HelperTasksScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ================== Auth Navigator ==================
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
}

// ================== Task Navigator (Customer) ==================
function TaskNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CreateTask" 
        component={CreateTaskScreen}
        options={{ title: 'Create New Task', headerShown: false }}
      />
      <Stack.Screen 
        name="TaskMatching" 
        component={TaskMatchingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TaskTracking" 
        component={TaskTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat with Helper' }}
      />
    </Stack.Navigator>
  );
}

// ================== Customer Tab Navigator ==================
function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Tasks" 
        component={TaskHistoryScreen}
        options={{ title: 'My Tasks' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ================== Helper Tab Navigator ==================
function HelperTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
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
        component={HelperHomeScreen} // Will be replaced with EarningsScreen in actual implementation
        options={{ title: 'Earnings' }}
      />
      <Tab.Screen 
        name="History" 
        component={HelperTasksScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ================== Main App Navigator ==================
export default function AppNavigator() {
  const { isAuthenticated, userRole, token, kycStatus } = useSelector((state) => state.auth);
  const helperAuth = useSelector((state) => state.helperAuth);

  const isHelperAuthenticated = helperAuth.isAuthenticated;
  const helperKycStatus = helperAuth.kycStatus;

  // Determine if we should show loading
  const [isReady, setIsReady] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState('Auth');

  React.useEffect(() => {
    // Determine initial route based on auth state
    if (isAuthenticated) {
      setInitialRoute(userRole === 'HELPER' ? 'HelperMain' : 'CustomerMain');
    } else if (isHelperAuthenticated) {
      setInitialRoute(helperKycStatus === 'VERIFIED' ? 'HelperMain' : 'KycFlow');
    }
    setIsReady(true);
  }, [isAuthenticated, isHelperAuthenticated, userRole, helperKycStatus]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated && !isHelperAuthenticated ? (
          // Not authenticated - show auth screens
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isHelperAuthenticated ? (
          // Helper is authenticated
          <>
            {helperKycStatus !== 'VERIFIED' && helperKycStatus !== 'REJECTED' ? (
              // KYC not verified - show KYC flow
              <Stack.Screen name="KycFlow" component={HelperAuthNavigator} />
            ) : (
              // KYC verified - show helper main app
              <Stack.Screen name="HelperMain" component={HelperStackNavigator} />
            )}
          </>
        ) : isAuthenticated ? (
          // Customer is authenticated
          <>
            <Stack.Screen name="CustomerMain" component={CustomerTabNavigator} />
            <Stack.Screen name="TaskFlow" component={TaskNavigator} />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ headerShown: true, title: 'Settings' }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ title: 'Chat' }}
            />
          </>
        ) : (
          // Fallback to auth
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
// No react-native imports needed on these lines if unused
import { loadApp } from '../store/authSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderRight from '../components/HeaderRight';
import TaskValidationLoader from '../components/TaskValidationLoader';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Mentee Screens
import MenteeDashboard from '../screens/mentee/MenteeDashboard';
import TaskSubmitScreen from '../screens/mentee/TaskSubmitScreen';
import MenteeGroupsScreen from '../screens/mentee/MenteeGroupsScreen';

// Mentor Screens
import MentorDashboard from '../screens/mentor/MentorDashboard';
import TaskCreateScreen from '../screens/mentor/TaskCreateScreen';
import ReviewScreen from '../screens/mentor/ReviewScreen';
import MentorGroupsScreen from '../screens/mentor/MentorGroupsScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserApprovalScreen from '../screens/admin/UserApprovalScreen';
import AdminGroupsScreen from '../screens/admin/AdminGroupsScreen';

// Shared Screens
import ProfileScreen from '../screens/shared/ProfileScreen';
import LeaderboardScreen from '../screens/shared/LeaderboardScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const getTabBarIcon = (route, focused, color, size) => {
  let iconName;

  switch (route.name) {
    case 'Dashboard':
      iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
      break;
    case 'My Groups':
    case 'Groups':
      iconName = focused ? 'account-group' : 'account-group-outline';
      break;
    case 'My Tasks':
      iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
      break;
    case 'Create Task':
      iconName = focused ? 'clipboard-plus' : 'clipboard-plus-outline';
      break;
    case 'Leaderboard':
      iconName = focused ? 'trophy' : 'trophy-outline';
      break;
    case 'Reviews':
      iconName = focused ? 'clipboard-check' : 'clipboard-check-outline';
      break;
    case 'Approvals':
      iconName = focused ? 'account-check' : 'account-check-outline';
      break;
    case 'Profile':
      iconName = focused ? 'account' : 'account-outline';
      break;
    default:
      iconName = 'circle';
  }

  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};

function MenteeTabs() {
  return (
    <Tab.Navigator screenOptions={({ route, navigation }) => ({ 
      headerShown: true,
      tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route, focused, color, size),
      headerRight: () => <HeaderRight />
    })}>
      <Tab.Screen name="Dashboard" component={MenteeDashboard} />
      <Tab.Screen name="My Groups" component={MenteeGroupsScreen} />
      <Tab.Screen name="My Tasks" component={TaskSubmitScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MentorTabs() {
  return (
    <Tab.Navigator screenOptions={({ route, navigation }) => ({ 
      headerShown: true,
      tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route, focused, color, size),
      headerRight: () => <HeaderRight />
    })}>
      <Tab.Screen name="Dashboard" component={MentorDashboard} />
      <Tab.Screen name="Groups" component={MentorGroupsScreen} />
      <Tab.Screen name="Create Task" component={TaskCreateScreen} />
      <Tab.Screen name="Reviews" component={ReviewScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={({ route, navigation }) => ({ 
      headerShown: true,
      tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route, focused, color, size),
      headerRight: () => <HeaderRight />
    })}>
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Groups" component={AdminGroupsScreen} />
      <Tab.Screen name="Approvals" component={UserApprovalScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ theme }) {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadApp());
  }, [dispatch]);

  if (isLoading) {
    return <TaskValidationLoader />;
  }

  const renderMainTabs = () => {
    if (!user) return <MenteeTabs />;
    if (user.role === 'ADMIN') return <AdminTabs />;
    if (user.role === 'MENTOR') return <MentorTabs />;
    return <MenteeTabs />;
  };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main">
              {() => renderMainTabs()}
            </Stack.Screen>
            {/* Can add modal screens here if needed */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

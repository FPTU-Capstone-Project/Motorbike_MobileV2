import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTabBar from '../components/CustomTabBar';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen.jsx';
import DriverRideHistoryScreen from '../screens/driver/DriverRideHistoryScreen.jsx';
import DriverRatingsScreen from '../screens/driver/DriverRatingsScreen.jsx';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen.jsx';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen.jsx';

const Tab = createBottomTabNavigator();

// Wrapper component để thêm padding bottom cho các screen
const withTabBarPadding = (Component) => {
  return (props) => {
    return <Component {...props} />;
  };
};

const DriverTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          insets={insets}
          iconMap={{
            DriverHome: 'home',
            DriverEarnings: 'account-balance-wallet',
            DriverRideHistory: 'history',
            Ratings: 'star',
            DriverProfile: 'person',
          }}
        />
      )}
      sceneContainerStyle={{
        paddingBottom: 0,
        backgroundColor: 'transparent',
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={withTabBarPadding(DriverHomeScreen)}
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen
        name="DriverEarnings"
        component={withTabBarPadding(DriverEarningsScreen)}
        options={{ tabBarLabel: 'Thu nhập' }}
      />
      <Tab.Screen
        name="DriverRideHistory"
        component={withTabBarPadding(DriverRideHistoryScreen)}
        options={{ tabBarLabel: 'Lịch sử' }}
      />
      <Tab.Screen
        name="Ratings"
        component={withTabBarPadding(DriverRatingsScreen)}
        options={{ tabBarLabel: 'Đánh giá' }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={withTabBarPadding(DriverProfileScreen)}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
};

export default DriverTabNavigator;

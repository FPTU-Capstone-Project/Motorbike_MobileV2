import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tab Icon Component với outline icons và animation
const TabIcon = ({ iconName, isFocused, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.2 : 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [isFocused, scaleAnim]);

  // Icon mapping: some icons don't have outline versions
  const iconMap = {
    'two-wheeler': {
      active: 'two-wheeler',
      inactive: 'two-wheeler', // No outline version, will use opacity
    },
    'account-balance-wallet': {
      active: 'account-balance-wallet',
      inactive: 'account-balance-wallet', // Use same icon with opacity
    },
    'history': {
      active: 'history',
      inactive: 'history', // No outline version, will use opacity
    },
    'person': {
      active: 'person',
      inactive: 'person-outline',
    },
    'home': {
      active: 'home',
      inactive: 'home',
    },
    'star': {
      active: 'star',
      inactive: 'star-outline',
    },
  };

  const iconConfig = iconMap[iconName] || {
    active: iconName,
    inactive: iconName.includes('-outline') ? iconName : `${iconName}-outline`,
  };

  const finalIconName = isFocused ? iconConfig.active : iconConfig.inactive;
  const iconOpacity = isFocused ? 1 : 0.6; // Lower opacity for inactive icons without outline

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 0,
      }}
      activeOpacity={0.7}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
          justifyContent: 'center',
          opacity: iconOpacity,
          width: 44,
          height: 44,
        }}
      >
        <Icon
          name={finalIconName}
          size={28}
          color={isFocused ? '#FFFFFF' : '#9CA3AF'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// Custom Tab Bar Component với icon design được cải thiện
const CustomTabBar = ({ state, descriptors, navigation, insets, iconMap }) => {
  const bottomSafe = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 6);
  const baseHeight = Platform.OS === 'ios' ? 64 : 56;
  const bottomOffset = 16;
  
  // Dynamic width based on number of tabs
  const tabCount = state.routes.length;
  const tabBarWidth = tabCount === 5 ? 300 : 240;
  const tabBarMarginLeft = tabCount === 5 ? -150 : -120;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: bottomOffset + bottomSafe,
        left: '50%',
        marginLeft: tabBarMarginLeft,
        width: tabBarWidth,
        height: baseHeight,
        borderRadius: 24,
        backgroundColor: 'transparent',
        // Shadow depth (neumorphism style - giống CleanCard)
        shadowColor: 'rgba(163, 177, 198, 0.65)',
        shadowOpacity: 0.32,
        shadowRadius: 18,
        shadowOffset: { width: 8, height: 10 },
        ...Platform.select({
          android: {
            elevation: 6,
          },
        }),
      }}
    >
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        <BlurView
          intensity={80}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        >
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              borderRadius: 24,
            }}
          />
        </BlurView>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 0,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Use provided iconMap or default to route name based mapping
          let iconName = iconMap?.[route.name] || 'two-wheeler';

          return (
            <TabIcon
              key={route.key}
              iconName={iconName}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

export default CustomTabBar;


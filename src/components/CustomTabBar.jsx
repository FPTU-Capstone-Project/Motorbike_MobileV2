import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/designTokens';

// Friendlier, full-width bottom nav similar to common ride-hailing apps
const TabIcon = ({ iconName, label, isFocused, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(isFocused ? 1.05 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.08 : 1,
      tension: 280,
      friction: 18,
      useNativeDriver: true,
    }).start();
  }, [isFocused, scaleAnim]);

  const activeColor = colors.primary;
  const inactiveColor = colors.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabItem}
      activeOpacity={0.85}
      hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
    >
      <Animated.View
        style={[
          styles.tabButton,
          isFocused && styles.tabButtonActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Icon
          name={iconName}
          size={24}
          color={isFocused ? activeColor : inactiveColor}
        />
        <Text
          style={[
            styles.tabLabel,
            isFocused ? styles.tabLabelActive : null,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation, insets, iconMap }) => {
  const bottomSafe = Math.max(insets?.bottom || 0, Platform.OS === 'android' ? 10 : 6);

  return (
    <View style={[styles.container, { paddingBottom: bottomSafe }]}>
      <View style={styles.bar}>
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

          const iconName = iconMap?.[route.name] || 'two-wheeler';
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          return (
            <TabIcon
              key={route.key}
              iconName={iconName}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 22,
    height: 68,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(17, 24, 39, 0.18)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    ...Platform.select({
      android: {
        elevation: 10,
      },
    }),
  },
  tabItem: {
    flex: 1,
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
});

export default CustomTabBar;


import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { palette, radius, spacing } from '../theme';

const SkeletonList = ({ rows = 4, height = 18 }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <Animated.View key={idx} style={[styles.row, { height, opacity }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: palette.primarySoft,
    borderRadius: radius.md,
  },
});

export default SkeletonList;

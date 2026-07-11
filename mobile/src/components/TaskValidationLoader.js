import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const TaskValidationLoader = () => {
  // Animation values for the 3 rows - using state initializer to ensure stable references without useRef render-access errors
  const [anim1] = useState(() => new Animated.Value(0));
  const [anim2] = useState(() => new Animated.Value(0));
  const [anim3] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const createRowAnimation = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false, // Colors and shadow require JS thread animation in RN
          }),
        ])
      );
    };

    const a1 = createRowAnimation(anim1, 0);
    const a2 = createRowAnimation(anim2, 400);
    const a3 = createRowAnimation(anim3, 800);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [anim1, anim2, anim3]);

  // Interpolation helper for translation and opacity of the sweep line
  const getSweepStyles = (anim) => {
    const translateX = anim.interpolate({
      inputRange: [0, 0.1, 0.4, 0.7, 1.0],
      outputRange: [-10, 65, 290, 290, -10],
    });

    const opacity = anim.interpolate({
      inputRange: [0, 0.1, 0.4, 0.7, 1.0],
      outputRange: [0, 1, 0, 0, 0],
    });

    return {
      transform: [{ translateX }],
      opacity,
    };
  };

  // Interpolation helper for check box state
  const getCheckBoxStyles = (anim) => {
    const scale = anim.interpolate({
      inputRange: [0, 0.15, 0.22, 0.30, 0.80, 0.90, 1.0],
      outputRange: [1, 1, 1.15, 1, 1, 1, 1],
    });

    const backgroundColor = anim.interpolate({
      inputRange: [0, 0.15, 0.22, 0.30, 0.80, 0.90, 1.0],
      outputRange: ['transparent', 'transparent', '#10b981', '#10b981', '#10b981', 'transparent', 'transparent'],
    });

    const borderColor = anim.interpolate({
      inputRange: [0, 0.15, 0.22, 0.30, 0.80, 0.90, 1.0],
      outputRange: ['rgba(99, 102, 241, 0.4)', 'rgba(99, 102, 241, 0.4)', '#10b981', '#10b981', '#10b981', 'rgba(99, 102, 241, 0.4)', 'rgba(99, 102, 241, 0.4)'],
    });

    return {
      transform: [{ scale }],
      backgroundColor,
      borderColor,
    };
  };

  const renderRow = (anim, skelWidth) => (
    <View style={styles.taskBarRow}>
      <Animated.View style={[styles.checkboxIndicator, getCheckBoxStyles(anim)]} />
      <View style={[styles.skeletonLine, { width: skelWidth }]} />
      <Animated.View style={[styles.validationSweep, getSweepStyles(anim)]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.matrixWorkspace}>
        {renderRow(anim1, 120)}
        {renderRow(anim2, 70)}
        {renderRow(anim3, 120)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixWorkspace: {
    width: 280,
    height: 160,
    justifyContent: 'space-between',
  },
  taskBarRow: {
    position: 'relative',
    width: '100%',
    height: 36,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  checkboxIndicator: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 4,
  },
  skeletonLine: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 3,
    marginLeft: 16,
  },
  validationSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#10b981', // Emerald/Indigo Sweep
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default TaskValidationLoader;

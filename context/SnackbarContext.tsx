import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type SnackbarVariant = 'info' | 'success' | 'error';

interface SnackbarPayload {
  message: string;
  variant?: SnackbarVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface SnackbarContextValue {
  showSnackbar: (payload: SnackbarPayload) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);
const DEFAULT_DURATION = 4000;

function getColors(variant: SnackbarVariant) {
  switch (variant) {
    case 'success':
      return { background: '#065F46', text: '#FFFFFF' };
    case 'error':
      return { background: '#991B1B', text: '#FFFFFF' };
    default:
      return { background: '#1F2937', text: '#FFFFFF' };
  }
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<SnackbarPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const clearTimer = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 80,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setPayload(null);
      }
    });
  }, [opacity, translateY]);

  const showSnackbar = useCallback((nextPayload: SnackbarPayload) => {
    setPayload(nextPayload);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible || !payload) return;
    animateIn();
    clearTimer();
    const duration = payload.durationMs ?? DEFAULT_DURATION;
    hideTimeout.current = setTimeout(() => {
      setVisible(false);
    }, duration);
    return () => {
      clearTimer();
    };
  }, [animateIn, payload, visible]);

  useEffect(() => {
    if (!visible && payload) {
      animateOut();
    }
  }, [animateOut, payload, visible]);

  useEffect(() => () => clearTimer(), []);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);
  const colors = getColors(payload?.variant ?? 'info');

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {payload && (
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={[
            styles.container,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.snackbar, { backgroundColor: colors.background }]}>
            <Text style={[styles.message, { color: colors.text }]}>{payload.message}</Text>
            {payload.actionLabel && payload.onAction && (
              <TouchableOpacity
                onPress={() => {
                  payload.onAction?.();
                  setVisible(false);
                }}
              >
                <Text style={[styles.action, { color: colors.text }]}>{payload.actionLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbarContext() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbarContext must be used within SnackbarProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    zIndex: 999,
  },
  snackbar: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  action: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';

const HEALTH_CHECK_URL = 'http://localhost:5000/health';

/**
 * Highly resilient, zero-dependency offline banner.
 * Periodically pings the backend service health endpoint to determine real connectivity status.
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

        const response = await fetch(HEALTH_CHECK_URL, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });

        clearTimeout(timeoutId);
        if (response.ok) {
          setIsOffline(false);
        } else {
          setIsOffline(true);
        }
      } catch (error) {
        setIsOffline(true);
      }
    };

    // Run connection test immediately
    checkConnection();

    // Check connection status every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  // Animates the banner entrance and exit smoothly
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOffline ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isOffline, fadeAnim]);

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
      <Text style={styles.bannerText}>
        ⚠️ Network Offline — Exam progress continues to auto-save locally.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    borderTopWidth: 1,
    borderColor: '#F87171',
    flexDirection: 'row',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

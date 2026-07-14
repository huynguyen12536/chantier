import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [permission, setPermission] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status === 'granted');
  };

  const getCurrentLocation = async (): Promise<LocationCoords | null> => {
    if (!permission) {
      Alert.alert('Permission requise', 'Veuillez autoriser la géolocalisation');
      return null;
    }

    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    loading,
    getCurrentLocation,
    requestPermission,
  };
}
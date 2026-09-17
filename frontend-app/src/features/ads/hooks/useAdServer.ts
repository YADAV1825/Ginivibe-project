import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

export interface AdCreative {
  type: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  headline?: string;
  description?: string;
  cta?: string;
  destinationUrl?: string;
}

export interface AdData {
  impressionId: string;
  adId: string;
  campaignId: string;
  placementType: 'FEED' | 'EXPLORE' | 'MATCHING';
  creative: AdCreative;
}

export type PlacementType = 'FEED' | 'EXPLORE' | 'MATCHING';

export interface UserTargetingContext {
  id?: string;
  age?: number;
  gender?: string;
  location?: string;
}

const resolveAdBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_AD_SERVER_URL) {
    return process.env.EXPO_PUBLIC_AD_SERVER_URL.replace(/\/$/, '');
  }

  const host =
    process.env.EXPO_PUBLIC_API_URL ||
    Platform.select({
      android: 'http://10.0.2.2:3001',
      default: 'http://localhost:3001',
    });

  return `${host}/api/ads`;
};

const adCache: Record<string, { data: AdData | null; timestamp: number }> = {};
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function useAdServer(placementType: PlacementType, currentUser?: UserTargetingContext) {
  const [adData, setAdData] = useState<AdData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const trackedImpressionId = useRef<string | null>(null);

  const baseUrl = resolveAdBaseUrl();

  const trackImpression = useCallback(
    async (adId: string, impId: string) => {
      if (trackedImpressionId.current === impId) return;
      trackedImpressionId.current = impId;

      try {
        await fetch(`${baseUrl}/analytics/impression`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            advertisementId: adId,
            placementType,
            userId: currentUser?.id,
          }),
        });
      } catch (err) {
        // Impression tracking is fire-and-forget; suppress network noise
      }
    },
    [baseUrl, placementType, currentUser?.id]
  );

  const fetchAd = useCallback(async () => {
    const cacheKey = `${placementType}_${currentUser?.id || 'anon'}`;
    const cached = adCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setAdData(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/serve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          placementType,
          userAge: currentUser?.age || 25,
          userGender: currentUser?.gender,
          userLocation: currentUser?.location,
        }),
      });

      if (res.status === 200) {
        const data: AdData = await res.json();
        adCache[cacheKey] = { data, timestamp: Date.now() };
        setAdData(data);
        if (data?.adId && data?.impressionId) {
          trackImpression(data.adId, data.impressionId);
        }
      } else {
        adCache[cacheKey] = { data: null, timestamp: Date.now() };
        setAdData(null);
      }
    } catch (err) {
      adCache[cacheKey] = { data: null, timestamp: Date.now() };
      setAdData(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, placementType, currentUser?.id, currentUser?.age, currentUser?.gender, currentUser?.location, trackImpression]);

  useEffect(() => {
    fetchAd();
  }, [fetchAd]);

  const trackClick = useCallback(() => {
    if (!adData) return;

    fetch(`${baseUrl}/analytics/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        advertisementId: adData.adId,
        placementType,
        userId: currentUser?.id,
      }),
    }).catch(() => {});
  }, [adData, baseUrl, placementType, currentUser?.id]);

  return {
    adData,
    loading,
    trackClick,
    refreshAd: fetchAd,
  };
}

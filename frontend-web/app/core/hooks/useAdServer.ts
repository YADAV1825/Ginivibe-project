import { useState, useEffect } from 'react';

// The URL of your new Enterprise Microservice
const AD_SERVER_URL = 'http://localhost:3005/api/v1';

export function useAdServer(placementType: 'FEED' | 'EXPLORE' | 'MATCHING', currentUser?: any) {
  const [adData, setAdData] = useState<any>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAd = async () => {
      try {
        const response = await fetch(`${AD_SERVER_URL}/ads/serve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser?.id,
            placementType: placementType,
            // Mock or actual user demographic data for targeting
            userAge: currentUser?.age || 25,
            userGender: currentUser?.gender,
            userLocation: currentUser?.location
          }),
          signal: controller.signal,
        });

        // 204 = no eligible ad — keep silent passthrough
        if (response.status === 204) {
          setAdData(null);
          return;
        }

        if (response.status === 200) {
          const data = await response.json();
          const mediaUrl = data?.creative?.mediaUrl;
          // Drop ads with missing/unusable media so the UI never shows a broken box.
          // (Broken URLs that pass this check are still hidden by NativeAdBanner's onError.)
          if (typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
            setAdData(null);
            return;
          }

          setAdData(data);
          
          // Fire Impression Tracking immediately after receiving the Ad
          trackImpression(data.adId);
          setSettled(true);
        } else {
          setAdData(null);
          setSettled(true);
        }
      } catch (error: any) {
        // Aborted (remount / new params): leave settled untouched so a
        // settled-without-data state can never kill a slot that is still
        // loading. Only genuine failures settle empty.
        if (error?.name === 'AbortError') return;
        console.error("Ad Engine Error:", error);
        setAdData(null);
        setSettled(true);
      }
    };

    fetchAd();
    return () => controller.abort();
  }, [placementType, currentUser]);

  const trackImpression = (adId: string) => {
    fetch(`${AD_SERVER_URL}/analytics/impression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advertisementId: adId, placementType, userId: currentUser?.id })
    }).catch(console.error); // Fire and forget
  };

  const trackClick = () => {
    if (!adData) return;
    fetch(`${AD_SERVER_URL}/analytics/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advertisementId: adData.adId, placementType, userId: currentUser?.id })
    }).catch(console.error);
  };

  return { adData, trackClick, settled };
}

import { EligibilityEngine } from './eligibility.service';

export class AdServingService {
  static async serveAd(requestData: any) {
    // Phase 8: Get eligible ads based on targeting and placement rules
    const eligibleAds = await EligibilityEngine.findEligibleAds(requestData);

    if (eligibleAds.length === 0) {
      return null; // No ad available to serve
    }

    // Phase 9: Ranking / Selection
    // For V1, we implement a simple randomized selection or uniform pacing.
    // In the future, this would be an auction or ML-based click-through prediction.
    const selectedAd = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];

    // Return the payload exactly as the frontend/mobile client needs to render it
    return {
      impressionId: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      adId: selectedAd.id,
      campaignId: selectedAd.campaignId,
      creative: {
        type: selectedAd.creative.mediaType,
        mediaUrl: selectedAd.creative.storageKey,
        headline: selectedAd.creative.headline,
        description: selectedAd.creative.description,
        cta: selectedAd.creative.ctaText,
        destinationUrl: selectedAd.creative.destinationUrl
      }
    };
  }
}

import { EligibilityEngine } from './src/modules/ads/services/eligibility.service';

async function test() {
  try {
    const requestData = { placementType: 'FEED', userAge: 25, userLocation: 'New York' };
    const ads = await EligibilityEngine.findEligibleAds(requestData);
    console.log("Ads:", ads);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();

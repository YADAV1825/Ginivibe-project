/* Pure intent-parsing + scoring for the AI-matching concept demo.
   No JSX, no React: safe to import anywhere, including tests. */

export interface SampleProfile {
  name: string;
  age: number;
  location: string;
  profession: string;
  professionKeywords: string[];
  interests: string[];
  sunSign: string;
  note: string;
}

/* Sample directory. The live matcher runs against real profiles in the app. */
export const DIRECTORY: SampleProfile[] = [
  {
    name: 'Ananya Sharma', age: 27, location: 'Delhi',
    profession: 'Founder, fintech startup', professionKeywords: ['founder', 'startup', 'entrepreneur'],
    interests: ['startups', 'trekking', 'jazz', 'cycling'],
    sunSign: 'Leo', note: 'Direct communicator who thrives in fast-moving rooms.',
  },
  {
    name: 'Rohan Mehta', age: 29, location: 'Delhi',
    profession: 'Product designer', professionKeywords: ['designer', 'design', 'product'],
    interests: ['typography', 'cinema', 'cycling', 'photography'],
    sunSign: 'Virgo', note: 'Detail-oriented; bonds over craft and long build sessions.',
  },
  {
    name: 'Priya Nair', age: 26, location: 'Bangalore',
    profession: 'Design engineer', professionKeywords: ['designer', 'engineer', 'design', 'developer'],
    interests: ['trekking', 'yoga', 'reading', 'startups'],
    sunSign: 'Libra', note: 'Balances logic with warmth; great in small-group conversations.',
  },
  {
    name: 'Arjun Malhotra', age: 31, location: 'Mumbai',
    profession: 'Musician', professionKeywords: ['musician', 'music', 'artist'],
    interests: ['classical music', 'late-night conversations', 'cinema', 'travel'],
    sunSign: 'Pisces', note: 'Expressive and reflective; hosts a weekly listening room.',
  },
  {
    name: 'Kavya Reddy', age: 25, location: 'Hyderabad',
    profession: 'Doctor', professionKeywords: ['doctor', 'medical'],
    interests: ['reading', 'cooking', 'yoga', 'travel'],
    sunSign: 'Cancer', note: 'Patient listener; prefers one deep conversation over ten small ones.',
  },
  {
    name: 'Vikram Singh', age: 28, location: 'Delhi',
    profession: 'Backend engineer', professionKeywords: ['engineer', 'developer', 'backend'],
    interests: ['gaming', 'startups', 'cycling', 'cinema'],
    sunSign: 'Aquarius', note: 'Systems thinker; always up for a weekend hack or ride.',
  },
  {
    name: 'Meera Iyer', age: 30, location: 'Chennai',
    profession: 'Writer', professionKeywords: ['writer', 'writing', 'author'],
    interests: ['reading', 'classical music', 'travel', 'photography'],
    sunSign: 'Scorpio', note: 'Observant and dry-witted; runs a monthly storytelling room.',
  },
  {
    name: 'Aditya Rao', age: 27, location: 'Pune',
    profession: 'Founder, edtech startup', professionKeywords: ['founder', 'startup', 'entrepreneur'],
    interests: ['startups', 'trekking', 'gaming', 'cooking'],
    sunSign: 'Aries', note: 'High-energy builder; organizes founder breakfasts in Pune.',
  },
];

const LOCATIONS = ['delhi', 'mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'pune'];
const PROFESSIONS = [
  'founder', 'designer', 'engineer', 'developer', 'musician', 'writer', 'doctor', 'artist', 'student',
];
const INTERESTS = [
  'trekking', 'music', 'classical music', 'cinema', 'startups', 'cycling', 'reading',
  'cooking', 'travel', 'gaming', 'photography', 'yoga', 'jazz', 'late-night conversations',
];
const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

export interface Criterion {
  kind: 'location' | 'profession' | 'interest' | 'sign';
  label: string;
  value: string;
}

export function parseIntent(intent: string): Criterion[] {
  const text = intent.toLowerCase();
  const criteria: Criterion[] = [];
  for (const loc of LOCATIONS) {
    if (text.includes(loc)) {
      const label = loc === 'bengaluru' ? 'Bangalore' : loc[0].toUpperCase() + loc.slice(1);
      criteria.push({ kind: 'location', label: `Lives in ${label}`, value: loc });
      break;
    }
  }
  for (const prof of PROFESSIONS) {
    if (text.includes(prof)) {
      criteria.push({ kind: 'profession', label: `Works as a ${prof}`, value: prof });
      break;
    }
  }
  for (const interest of INTERESTS) {
    if (text.includes(interest)) {
      criteria.push({ kind: 'interest', label: `Into ${interest}`, value: interest });
    }
  }
  for (const sign of SIGNS) {
    if (text.includes(sign)) {
      criteria.push({
        kind: 'sign',
        label: `${sign[0].toUpperCase() + sign.slice(1)} sun`,
        value: sign,
      });
      break;
    }
  }
  return criteria;
}

export interface ScoredMatch {
  profile: SampleProfile;
  score: number;
  reasons: string[];
}

export function scoreProfiles(criteria: Criterion[]): ScoredMatch[] {
  if (criteria.length === 0) return [];
  const scored = DIRECTORY.map((profile) => {
    let score = 52;
    const reasons: string[] = [];
    for (const c of criteria) {
      if (c.kind === 'location' && profile.location.toLowerCase().startsWith(c.value.slice(0, 4))) {
        score += 22;
        reasons.push(`Lives in ${profile.location}.`);
      } else if (
        c.kind === 'profession' &&
        profile.professionKeywords.some((k) => k.includes(c.value) || c.value.includes(k))
      ) {
        score += 18;
        reasons.push(`${profile.profession}.`);
      } else if (
        c.kind === 'interest' &&
        profile.interests.some((i) => i.includes(c.value) || c.value.includes(i))
      ) {
        score += 9;
        reasons.push(`Shares your interest in ${c.value}.`);
      } else if (c.kind === 'sign' && profile.sunSign.toLowerCase() === c.value) {
        score += 8;
        reasons.push(`${profile.sunSign} sun, compatible with your chart.`);
      }
    }
    if (reasons.length > 0) reasons.push(profile.note);
    return { profile, score: Math.min(score, 98), reasons };
  });
  return scored
    .filter((s) => s.reasons.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export const PRESETS = [
  'I want to connect with a founder in Delhi.',
  'Looking for a designer in Bangalore who likes trekking.',
  'Someone in Mumbai into classical music and late-night conversations.',
];

export const DEFAULT_INTENT = PRESETS[0];

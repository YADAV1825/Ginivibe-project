export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface MatchProfile {
  id: string;
  name: string;
  avatarUrl: string;
  age: number;
  location: string;
  matchScore: number;
  bio: string;
  tags: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'live' | 'future' | 'online' | 'offline';
  date: string;
  location?: string;
  attendeesCount: number;
  imageUrl?: string;
}

export interface AstrologyInsight {
  id: string;
  category: 'wealth' | 'career' | 'luck' | 'relationships' | 'health' | 'family' | 'business';
  title: string;
  description: string;
  score: number; // 0-100
}

export interface BirthDetails {
  name: string;
  date: string;
  time: string;
  timezone: string;
  latitude: number;
  longitude: number;
  countryCode: string;
  stateCode: string;
  city: string;
}

export interface CalculatedPlanet {
  planet: string;
  sign: string;
  sign_index: number;
  degree: number;
  house: number;
  absolute_longitude: number;
  retrograde: boolean;
  nakshatra?: string;
  pada?: number;
  navamsa_number?: number;
}

export interface HouseInfo {
  sign: string;
  sign_index: number;
  planets: CalculatedPlanet[];
}

export interface ChartJSON {
  birth: BirthDetails;
  settings: any;
  lagna: any;
  d1: {
    houses: Record<number, HouseInfo>;
    planets: Record<string, CalculatedPlanet>;
  };
  d9: {
    houses: Record<number, HouseInfo>;
    planets: Record<string, CalculatedPlanet>;
  };
}

export interface InterpretationResult {
  houses: Array<{
    houseNumber: number;
    sign: string;
    ruler: string;
    planetsPresent: string[];
    signification: string;
    interpretation: string;
  }>;
  lifeAreas: Array<{
    category: string;
    score: number;
    interpretation: string;
  }>;
}

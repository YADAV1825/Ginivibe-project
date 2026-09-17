export interface CandidateProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  avatarUrl: string;
  tags: string[];
  handle?: string;
  gender?: string;
  zodiacSign?: string;
  location?: string;
  personalityType?: string;
  mantra?: string;
  emojis?: string;
  localTime?: string;
  languages?: Array<{ name: string; flag: string; primary?: boolean }>;
}

export interface CandidateScore {
  candidateId: string;
  score?: number;
  totalScore?: number;
  details?: Record<string, any>;
}

export interface MatchResponse {
  match: CandidateScore;
  profile: CandidateProfile;
}

export interface FollowRequestPayload {
  targetUserId: string;
  message?: string;
}

export interface FollowResponse {
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface LiveCandidate {
  id: string;
  name?: string;
  firstName?: string;
  username?: string;
  profilePic?: string;
  avatarUrl?: string;
  gender?: string;
  age?: number;
  bio?: string;
  tags?: string[];
  matchScore?: number;
}

export interface CallRequest {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  caller?: {
    id: string;
    username?: string;
    firstName?: string;
    profilePic?: string;
  };
}

export type LiveCallState = 
  | 'IDLE' 
  | 'CONNECTING' 
  | 'SEARCHING' 
  | 'FOUND' 
  | 'IN_CALL' 
  | 'DISCONNECTED' 
  | 'ENDED';

export interface MatchingCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
}

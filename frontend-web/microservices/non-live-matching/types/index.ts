export interface CandidateProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  avatarUrl: string;
  tags: string[];
  location?: string;
  zodiacSign?: string;
}

export interface CandidateScore {
  candidateId: string;
  score: number;
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

export interface MatchingCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  iconName: string;
}

export interface Candidate {
  id: string;
  gender?: string | null;
  dob?: Date | null;
  interests: string[];
  kundliScore?: number;
  zodiacSign?: string;
  events: string[];
}

export interface ExclusionContext {
  userId: string;
  blockedUserIds: Set<string>;
  blockedByUserIds: Set<string>;
  seenCandidateIds: Set<string>;
  followingIds: Set<string>;
}

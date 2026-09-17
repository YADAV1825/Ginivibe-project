type Availability = 'AVAILABLE' | 'BUSY' | 'IN_CALL' | 'DO_NOT_DISTURB';

class PresenceService {
  // Map of userId to a Set of active socket IDs
  private userSockets: Map<string, Set<string>> = new Map();
  // Map of userId to their current availability
  private userAvailability: Map<string, Availability> = new Map();

  addSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    
    // Default to AVAILABLE if they just came online and didn't have a state
    if (!this.userAvailability.has(userId)) {
      this.userAvailability.set(userId, 'AVAILABLE');
    }
  }

  removeSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        // User is completely offline
        this.userSockets.delete(userId);
        this.userAvailability.delete(userId);
      }
    }
  }

  setAvailability(userId: string, availability: Availability) {
    // Only set if they are online
    if (this.isOnline(userId)) {
      this.userAvailability.set(userId, availability);
    }
  }

  getAvailability(userId: string): Availability | null {
    return this.userAvailability.get(userId) || null;
  }

  isOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  isAvailable(userId: string): boolean {
    return this.getAvailability(userId) === 'AVAILABLE';
  }

  getOnlineAvailableUserIds(): string[] {
    const availableUsers: string[] = [];
    for (const userId of this.userSockets.keys()) {
      const availability = this.userAvailability.get(userId) || 'AVAILABLE';
      if (availability !== 'IN_CALL') {
        availableUsers.push(userId);
      }
    }
    return availableUsers;
  }
  
  getSocketsForUser(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }
}

export const presenceService = new PresenceService();

import { Socket } from 'socket.io';
import { presenceService } from './presence.service';

export const registerPresenceSocketHandlers = (socket: Socket) => {
  // We assume socket.data.userId is set by the auth middleware

  socket.on('set_availability', (data: { availability: string }) => {
    const validAvailabilities = ['AVAILABLE', 'BUSY', 'IN_CALL', 'DO_NOT_DISTURB'];
    if (validAvailabilities.includes(data.availability)) {
      presenceService.setAvailability(socket.data.userId, data.availability as any);
      // Optional: Broadcast availability change to other users
      socket.broadcast.emit('user_availability_changed', { 
        userId: socket.data.userId, 
        availability: data.availability 
      });
      socket.broadcast.emit('user_presence_update', {
        userId: socket.data.userId,
        status: data.availability === 'AVAILABLE' ? 'ONLINE' : data.availability
      });
    }
  });
};

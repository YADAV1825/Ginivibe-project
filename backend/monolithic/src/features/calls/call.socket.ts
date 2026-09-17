import { Server } from 'socket.io';
import { presenceService } from '../presence/presence.service';

let ioInstance: Server;

export const initCallSocket = (io: Server) => {
  ioInstance = io;
};

export const getCallSocket = () => ioInstance;

export const emitToUser = (userId: string, event: string, data: any) => {
  if (!ioInstance) {
    console.warn('[CallSocket] emitToUser called before ioInstance was initialized');
    return;
  }
  const sockets = presenceService.getSocketsForUser(userId);
  console.log(`[CallSocket] emitToUser: event=${event}, targetUserId=${userId}, activeSockets=${sockets.length}`);
  
  if (sockets.length > 0) {
    sockets.forEach(socketId => {
      ioInstance.to(socketId).emit(event, data);
    });
  } else {
    // Fallback broadcast with targetUserId if socket mapping not yet registered
    ioInstance.emit(event, { ...data, targetUserId: userId });
  }
};

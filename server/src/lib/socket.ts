import { Server as SocketIOServer } from "socket.io";

export function getIO(): SocketIOServer | null {
  return (global as any).__io || null;
}

export function emitToComputer(computerId: string, event: string, data: unknown) {
  const io = getIO();
  if (io) {
    io.to(`computer:${computerId}`).emit(event, data);
  }
}

export function emitToDashboard(event: string, data: unknown) {
  const io = getIO();
  if (io) {
    io.to("dashboard").emit(event, data);
  }
}

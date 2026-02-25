import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
    path: "/api/socketio",
  });

  // Store io instance globally so API routes can access it
  (global as any).__io = io;

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Admin joins a room to receive dashboard updates
    socket.on("join:dashboard", () => {
      socket.join("dashboard");
    });

    // Admin joins a specific computer room
    socket.on("join:computer", (computerId: string) => {
      socket.join(`computer:${computerId}`);
    });

    socket.on("leave:computer", (computerId: string) => {
      socket.leave(`computer:${computerId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

// src/index.ts
import express from 'express';
import http from 'http';
import { SocketServer } from './SocketServer';
import apiRoutes from './routes';
import cors from 'cors';
const app = express();
const server = http.createServer(app);
const socketServer = new SocketServer(server);

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    socketServer
    console.log(`Server running on port ${PORT}`);
});
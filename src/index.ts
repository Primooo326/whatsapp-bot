// src/index.ts
import express from 'express';
import http from 'http';
import { SocketServer } from './SocketServer';

const app = express();
const server = http.createServer(app);
const socketServer = new SocketServer(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    socketServer
    console.log(`Server running on port ${PORT}`);
});
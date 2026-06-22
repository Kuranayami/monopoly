import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initStore } from './store.js';
import socketHandler from './socketHandler.js';

const app = express();
const server = createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || '*';
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

await initStore();

socketHandler(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Monopoly server running on port ${PORT}`);
});

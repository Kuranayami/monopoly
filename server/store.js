import mongoose from 'mongoose';
import Game from './models/Game.js';
import Player from './models/Player.js';

let useMongo = false;
const memoryGames = new Map();
const memoryPlayers = new Map();

export async function initStore() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://monopoly:monopoly123@cluster0.xxxxx.mongodb.net/monopoly?retryWrites=true&w=majority', {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    useMongo = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.log('MongoDB unavailable, using in-memory store');
    useMongo = false;
  }
}

export function isConnected() { return useMongo; }

// Game operations
export async function createGame(gameData) {
  if (useMongo) {
    const game = new Game(gameData);
    return await game.save();
  }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const game = { ...gameData, _id: id, id, createdAt: new Date(), updatedAt: new Date() };
  memoryGames.set(id, game);
  return game;
}

export async function getGame(gameId) {
  if (useMongo) {
    return await Game.findById(gameId);
  }
  return memoryGames.get(gameId) || null;
}

export async function updateGame(gameId, updates) {
  if (useMongo) {
    return await Game.findByIdAndUpdate(gameId, { ...updates, updatedAt: new Date() }, { new: true });
  }
  const game = memoryGames.get(gameId);
  if (!game) return null;
  Object.assign(game, updates, { updatedAt: new Date() });
  return game;
}

export async function deleteGame(gameId) {
  if (useMongo) {
    return await Game.findByIdAndDelete(gameId);
  }
  return memoryGames.delete(gameId);
}

export async function listGames() {
  if (useMongo) {
    return await Game.find({ status: { $ne: 'finished' } }).sort({ createdAt: -1 });
  }
  return Array.from(memoryGames.values()).filter(g => g.status !== 'finished').sort((a, b) => b.createdAt - a.createdAt);
}

// Player operations
export async function createPlayer(playerData) {
  if (useMongo) {
    const player = new Player(playerData);
    return await player.save();
  }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const player = { ...playerData, _id: id, id, createdAt: new Date() };
  memoryPlayers.set(id, player);
  return player;
}

export async function getPlayer(playerId) {
  if (useMongo) {
    return await Player.findById(playerId);
  }
  return memoryPlayers.get(playerId) || null;
}

export async function updatePlayer(playerId, updates) {
  if (useMongo) {
    return await Player.findByIdAndUpdate(playerId, updates, { new: true });
  }
  const player = memoryPlayers.get(playerId);
  if (!player) return null;
  Object.assign(player, updates);
  return player;
}

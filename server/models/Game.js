import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  hostName: { type: String, required: true },
  players: [{
    id: String,
    name: String,
    token: String,
    cash: { type: Number, default: 1500 },
    position: { type: Number, default: 0 },
    properties: [Number],
    houses: { type: Map, of: Number, default: {} },
    hotels: { type: Map, of: Boolean, default: {} },
    inJail: { type: Boolean, default: false },
    jailTurns: { type: Number, default: 0 },
    getOutOfJailCards: { type: Number, default: 0 },
    isBankrupt: { type: Boolean, default: false },
    consecutiveDoubles: { type: Number, default: 0 },
    connected: { type: Boolean, default: false },
    socketId: { type: String, default: null },
    turnOrder: Number,
  }],
  canRollAgain: { type: Boolean, default: false },
  currentTurn: { type: Number, default: 0 },
  turnPhase: { type: String, default: 'pre_roll' },
  status: { type: String, default: 'waiting' },
  dice: [Number],
  lastAction: String,
  freeParkingPool: { type: Number, default: 0 },
  chat: [{
    playerId: String,
    playerName: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  startedAt: Date,
  finishedAt: Date,
  winner: String,
}, { timestamps: true });

export default mongoose.model('Game', gameSchema);

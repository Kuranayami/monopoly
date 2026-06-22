import { SPACES, TOKENS, COMMUNITY_CHEST, CHANCE, STARTING_CASH, GO_SALARY, JAIL_BAIL, MAX_JAIL_TURNS, MAX_CONSECUTIVE_DOUBLES } from '../shared/constants.js';
import { rollDice, isDoubles, movePlayer, calculateRent, canBuildHouse, canBuildHotel, canSellHouse, calculateStreetRepair, calculateAssets, findNextActivePlayer, checkGameOver, playerOwnsFullGroup } from './gameLogic.js';
import { createGame, getGame, updateGame, listGames } from './store.js';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const auctionTimers = new Map();

async function finishAuction(io, game) {
  const space = SPACES[game.auction.spaceId];
  if (!space) return;
  const timerId = auctionTimers.get(game.roomCode);
  if (timerId) { clearTimeout(timerId); auctionTimers.delete(game.roomCode); }
  if (game.auction.currentBidder) {
    const winner = game.players.find(p => p.id === game.auction.currentBidder);
    if (winner) {
      winner.cash -= game.auction.currentBid;
      winner.properties.push(game.auction.spaceId);
      game.lastAction = `${winner.name} won ${space.name} at auction for $${game.auction.currentBid}`;
    }
  } else {
    game.lastAction = `${space.name} was auctioned but no one bid`;
  }
  delete game.auction;
  await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction, auction: undefined });
  io.to(game.roomCode).emit('auction_ended');
  io.to(game.roomCode).emit('game_updated', await getGame(game.roomCode));
}

export default function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    let currentPlayerId = null;
    let currentRoom = null;

    socket.on('create_room', async ({ playerName, token }, callback) => {
      try {
        let roomCode;
        let attempts = 0;
        do {
          roomCode = generateRoomCode();
          const existing = await getGame(roomCode);
          if (!existing) break;
          attempts++;
        } while (attempts < 10);

        const gameData = {
          roomCode,
          hostName: playerName,
          players: [{
            id: socket.id,
            name: playerName,
            token,
            cash: STARTING_CASH,
            position: 0,
            properties: [],
            mortgaged: [],
            houses: {},
            hotels: {},
            inJail: false,
            jailTurns: 0,
            getOutOfJailCards: 0,
            isBankrupt: false,
            consecutiveDoubles: 0,
            connected: true,
            socketId: socket.id,
            turnOrder: 0,
          }],
          canRollAgain: false,
          currentTurn: 0,
          turnPhase: 'pre_roll',
          status: 'waiting',
          dice: [],
          lastAction: `${playerName} created the room`,
          freeParkingPool: 0,
          chat: [],
        };

        const game = await createGame(gameData);
        currentPlayerId = socket.id;
        currentRoom = roomCode;
        socket.join(roomCode);
        callback({ success: true, game, playerId: socket.id });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('join_room', async ({ roomCode, playerName, token }, callback) => {
      try {
        const game = await getGame(roomCode.toUpperCase());
        if (!game) return callback({ success: false, error: 'Room not found' });
        if (game.status !== 'waiting') return callback({ success: false, error: 'Game already started' });
        if (game.players.length >= 6) return callback({ success: false, error: 'Room is full' });
        if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
          return callback({ success: false, error: 'Name already taken' });
        }

        const tokens = game.players.map(p => p.token);
        if (tokens.includes(token)) return callback({ success: false, error: 'Token already taken' });

        const newPlayer = {
          id: socket.id,
          name: playerName,
          token,
          cash: STARTING_CASH,
          position: 0,
          properties: [],
          mortgaged: [],
          houses: {},
          hotels: {},
          inJail: false,
          jailTurns: 0,
          getOutOfJailCards: 0,
          isBankrupt: false,
          consecutiveDoubles: 0,
          connected: true,
          socketId: socket.id,
          turnOrder: game.players.length,
        };

        game.players.push(newPlayer);
        game.lastAction = `${playerName} joined the room`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });

        currentPlayerId = socket.id;
        currentRoom = game.roomCode;
        socket.join(game.roomCode);
        io.to(game.roomCode).emit('game_updated', await getGame(game.roomCode));
        callback({ success: true, game: await getGame(game.roomCode), playerId: socket.id });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('reconnect_player', async ({ playerId, roomCode }, callback) => {
      try {
        const game = await getGame(roomCode);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === playerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        player.connected = true;
        player.socketId = socket.id;
        await updateGame(roomCode, { players: game.players });
        currentPlayerId = playerId;
        currentRoom = roomCode;
        socket.join(roomCode);
        io.to(roomCode).emit('game_updated', await getGame(roomCode));
        callback({ success: true, game: await getGame(roomCode) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('leave_room', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return typeof callback === 'function' && callback({ success: false, error: 'Game not found' });
        const idx = game.players.findIndex(p => p.id === currentPlayerId);
        if (idx === -1) return typeof callback === 'function' && callback({ success: false, error: 'Player not found' });
        const leavingName = game.players[idx].name;
        game.players.splice(idx, 1);
        if (game.players.length === 0) {
          await deleteGame(currentRoom);
          return typeof callback === 'function' && callback({ success: true });
        }
        if (game.hostName === leavingName) {
          game.hostName = game.players[0].name;
          game.lastAction = `${game.hostName} is now host`;
        }
        await updateGame(game.roomCode, { players: game.players, hostName: game.hostName, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        typeof callback === 'function' && callback({ success: true });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('start_game', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return typeof callback === 'function' && callback({ success: false, error: 'Game not found' });
        if (game.players.length < 2) return typeof callback === 'function' && callback({ success: false, error: 'Need at least 2 players' });
        game.players = shuffleArray(game.players).map((p, i) => ({ ...p, turnOrder: i }));
        game.status = 'playing';
        game.startedAt = new Date();
        game.turnPhase = 'pre_roll';
        game.canRollAgain = false;
        game.lastAction = `Game started! ${game.players[0].name}'s turn`;
        await updateGame(game.roomCode, {
          players: game.players,
          status: game.status,
          startedAt: game.startedAt,
          turnPhase: game.turnPhase,
          canRollAgain: false,
          lastAction: game.lastAction,
        });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        typeof callback === 'function' && callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        console.error(`Error in start_game for room ${currentRoom}:`, err);
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('roll_dice', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        if (game.players[game.currentTurn]?.id !== currentPlayerId) {
          return callback({ success: false, error: 'Not your turn' });
        }
        if (game.turnPhase !== 'pre_roll') {
          return callback({ success: false, error: 'Already rolled this turn' });
        }

        const dice = rollDice();
        const double = isDoubles(dice);
        const diceTotal = dice[0] + dice[1];
        game.lastDiceTotal = diceTotal;
        game.dice = dice;
        game.turnPhase = 'post_roll';

        const playerIndex = game.currentTurn;

        if (player.inJail) {
          if (double) {
            player.inJail = false;
            player.jailTurns = 0;
            game.lastAction = `${player.name} rolled doubles to get out of jail!`;
            const { newPos, passedGo } = movePlayer(player, diceTotal);
            if (passedGo) { player.cash += GO_SALARY; game.lastAction += ` Passed GO, collected $${GO_SALARY}.`; }
            player.position = newPos;
            handleLanding(game, player, diceTotal, io);
          } else {
            player.jailTurns++;
            if (player.jailTurns >= MAX_JAIL_TURNS) {
              player.cash -= JAIL_BAIL;
              player.inJail = false;
              player.jailTurns = 0;
              game.lastAction = `${player.name} paid $${JAIL_BAIL} after 3 turns in jail.`;
              const { newPos, passedGo } = movePlayer(player, diceTotal);
              if (passedGo) { player.cash += GO_SALARY; }
              player.position = newPos;
              handleLanding(game, player, diceTotal, io);
            } else {
              game.lastAction = `${player.name} is still in jail (turn ${player.jailTurns}/${MAX_JAIL_TURNS})`;
            }
          }
          await updateGame(game.roomCode, {
            players: game.players, dice: game.dice, turnPhase: game.turnPhase,
            lastAction: game.lastAction, lastDiceTotal: game.lastDiceTotal,
          });
          io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
          return callback({ success: true, double, dice, game: await getGame(currentRoom) });
        }

        if (double) {
          player.consecutiveDoubles = (player.consecutiveDoubles || 0) + 1;
          if (player.consecutiveDoubles >= MAX_CONSECUTIVE_DOUBLES) {
            player.consecutiveDoubles = 0;
            sendToJail(game, player);
            game.lastAction = `${player.name} rolled 3 consecutive doubles and is sent to jail!`;
            game.canRollAgain = false;
            const nextIdx = findNextActivePlayer(game, game.currentTurn);
            game.currentTurn = nextIdx;
            game.dice = [];
            game.turnPhase = 'pre_roll';
            game.lastDiceTotal = null;
            await updateGame(game.roomCode, {
              players: game.players, dice: game.dice, turnPhase: game.turnPhase,
              lastAction: game.lastAction, lastDiceTotal: game.lastDiceTotal,
              currentTurn: game.currentTurn, canRollAgain: false,
            });
            io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
            return callback({ success: true, double, dice, sentToJail: true, game: await getGame(currentRoom) });
          }
        } else {
          player.consecutiveDoubles = 0;
        }

        game.lastAction = `${player.name} rolled ${dice[0]} + ${dice[1]} = ${diceTotal}`;
        const { newPos, passedGo } = movePlayer(player, diceTotal);
        if (passedGo) {
          player.cash += GO_SALARY;
          game.lastAction += `. Passed GO, collected $${GO_SALARY}`;
        }
        player.position = newPos;
        handleLanding(game, player, diceTotal, io);

        if (double && !player.inJail) {
          game.canRollAgain = true;
          game.lastAction += ` Doubles! Roll again.`;
        }

        await updateGame(game.roomCode, {
          players: game.players, dice: game.dice, turnPhase: game.turnPhase,
          lastAction: game.lastAction, lastDiceTotal: game.lastDiceTotal,
          canRollAgain: game.canRollAgain,
        });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, double, dice, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('end_turn', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        if (game.players[game.currentTurn]?.id !== currentPlayerId) {
          return callback({ success: false, error: 'Not your turn' });
        }
        const player = game.players[game.currentTurn];
        if (player.inJail && game.turnPhase === 'pre_roll') {
          return callback({ success: false, error: 'Must roll dice, pay bail, or use jail card' });
        }
        if (game.turnPhase !== 'post_roll') {
          game.lastAction = `${player.name} must roll first`;
          await updateGame(game.roomCode, { lastAction: game.lastAction });
          io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
          return callback({ success: false, error: 'Must roll dice first' });
        }
        // Double roll: give extra roll instead of ending turn
        if (game.canRollAgain) {
          player.paidRentThisTurn = false;
          game.canRollAgain = false;
          game.turnPhase = 'pre_roll';
          game.dice = [];
          game.lastAction = `${player.name} gets another roll!`;
          game.lastDiceTotal = null;
          await updateGame(game.roomCode, {
            turnPhase: game.turnPhase, dice: game.dice, lastAction: game.lastAction,
            lastDiceTotal: game.lastDiceTotal, canRollAgain: false,
          });
          io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
          return callback({ success: true, rollAgain: true, game: await getGame(currentRoom) });
        }

        // Reset paidRent flag for next player's turn
        player.paidRentThisTurn = false;
        game.canRollAgain = false;
        game.turnPhase = 'pre_roll';
        game.dice = [];
        const nextIdx = findNextActivePlayer(game, game.currentTurn);
        game.currentTurn = nextIdx;
        game.lastAction = `${game.players[nextIdx].name}'s turn`;
        game.lastDiceTotal = null;
        await updateGame(game.roomCode, {
          currentTurn: game.currentTurn, turnPhase: game.turnPhase, dice: game.dice,
          lastAction: game.lastAction, lastDiceTotal: game.lastDiceTotal,
          canRollAgain: false,
        });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('buy_property', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        const space = SPACES[player.position];
        if (!space || !['property', 'railroad', 'utility'].includes(space.type)) {
          return callback({ success: false, error: 'Cannot buy this space' });
        }
        if (game.players.some(p => p.properties.includes(player.position) && !p.isBankrupt)) {
          return callback({ success: false, error: 'Already owned' });
        }
        if (player.cash < space.price) return callback({ success: false, error: 'Not enough cash' });

        player.cash -= space.price;
        player.properties.push(player.position);
        game.lastAction = `${player.name} bought ${space.name} for $${space.price}`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('start_auction', async (data, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return typeof callback === 'function' && callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return typeof callback === 'function' && callback({ success: false, error: 'Player not found' });
        const spaceId = data?.spaceId;
        if (spaceId === undefined || spaceId === null) return typeof callback === 'function' && callback({ success: false, error: 'No space specified' });
        const space = SPACES[spaceId];
        if (!space) return typeof callback === 'function' && callback({ success: false, error: 'Space not found' });
        if (game.players.some(p => p.properties.includes(spaceId) && !p.isBankrupt)) {
          return typeof callback === 'function' && callback({ success: false, error: 'Already owned' });
        }
        const existingTimer = auctionTimers.get(currentRoom);
        if (existingTimer) clearTimeout(existingTimer);
        game.auction = { spaceId, currentBid: 0, currentBidder: null, bidders: {}, skipVotes: [], timerEnd: Date.now() + 5000 };
        game.lastAction = `Auction started for ${space.name}!`;
        await updateGame(game.roomCode, { auction: game.auction, lastAction: game.lastAction });
        io.to(currentRoom).emit('auction_started', { spaceId });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        typeof callback === 'function' && callback({ success: true });
        const timer = setTimeout(async () => {
          const g = await getGame(currentRoom);
          if (g && g.auction) await finishAuction(io, g);
          auctionTimers.delete(currentRoom);
        }, 3000);
        auctionTimers.set(currentRoom, timer);
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('auction_bid', async ({ bid }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return typeof callback === 'function' && callback({ success: false, error: 'Game not found' });
        if (!game.auction) return typeof callback === 'function' && callback({ success: false, error: 'No active auction' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return typeof callback === 'function' && callback({ success: false, error: 'Player not found' });
        const space = SPACES[game.auction.spaceId];
        if (!space) return typeof callback === 'function' && callback({ success: false, error: 'Space not found' });
        const amount = parseInt(bid);
        if (isNaN(amount) || amount <= 0) return typeof callback === 'function' && callback({ success: false, error: 'Invalid bid amount' });
        if (amount <= game.auction.currentBid) return typeof callback === 'function' && callback({ success: false, error: 'Bid must be higher than current bid' });
        if (amount > player.cash) return typeof callback === 'function' && callback({ success: false, error: 'Not enough cash' });

        game.auction.currentBid = amount;
        game.auction.currentBidder = player.id;
        game.auction.bidders[player.id] = amount;
        game.auction.timerEnd = Date.now() + 5000;
        game.lastAction = `${player.name} bids $${amount} on ${space.name}`;
        await updateGame(game.roomCode, { auction: game.auction, lastAction: game.lastAction });
        io.to(currentRoom).emit('auction_update', { ...game.auction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        typeof callback === 'function' && callback({ success: true });
        const existingTimer = auctionTimers.get(currentRoom);
        if (existingTimer) clearTimeout(existingTimer);
        const newTimer = setTimeout(async () => {
          const g = await getGame(currentRoom);
          if (g && g.auction) await finishAuction(io, g);
          auctionTimers.delete(currentRoom);
        }, 3000);
        auctionTimers.set(currentRoom, newTimer);
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('auction_skip_vote', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return typeof callback === 'function' && callback({ success: false, error: 'Game not found' });
        if (!game.auction) return typeof callback === 'function' && callback({ success: false, error: 'No active auction' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return typeof callback === 'function' && callback({ success: false, error: 'Player not found' });
        if (game.auction.skipVotes.includes(currentPlayerId)) {
          return typeof callback === 'function' && callback({ success: false, error: 'Already voted to skip' });
        }
        game.auction.skipVotes.push(currentPlayerId);
        const activePlayers = game.players.filter(p => !p.isBankrupt).length;
        if (game.auction.skipVotes.length >= Math.ceil(activePlayers / 2)) {
          await finishAuction(io, game);
        } else {
          game.lastAction = `${player.name} voted to skip the auction (${game.auction.skipVotes.length}/${Math.ceil(activePlayers / 2)} needed)`;
          await updateGame(game.roomCode, { auction: game.auction, lastAction: game.lastAction });
          io.to(currentRoom).emit('auction_update', { ...game.auction });
          io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        }
        typeof callback === 'function' && callback({ success: true });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('pay_rent', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        if (player.paidRentThisTurn) return callback({ success: false, error: 'Already paid rent' });
        const rent = calculateRent(player.position, game);
        if (rent <= 0) return callback({ success: false, error: 'No rent due' });
        const owner = game.players.find(p => p.properties.includes(player.position) && !p.isBankrupt);
        if (!owner) return callback({ success: false, error: 'No owner' });

        player.paidRentThisTurn = true;
        player.cash -= rent;
        owner.cash += rent;
        game.lastAction = `${player.name} paid $${rent} rent to ${owner.name}`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('pay_tax', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return typeof callback === 'function' && callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return typeof callback === 'function' && callback({ success: false, error: 'Player not found' });
        const space = SPACES[player.position];
        if (!space || space.type !== 'tax') return typeof callback === 'function' && callback({ success: false, error: 'Not on a tax space' });

        const amount = space.taxAmount;
        player.cash -= amount;
        game.freeParkingPool = (game.freeParkingPool || 0) + amount;
        game.lastAction = `${player.name} paid $${amount} tax`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction, freeParkingPool: game.freeParkingPool });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        typeof callback === 'function' && callback({ success: true });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('build_house', async ({ spaceId }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        if (!canBuildHouse(player, spaceId, game)) return callback({ success: false, error: 'Cannot build here' });
        const space = SPACES[spaceId];
        player.cash -= space.buildCost;
        const current = player.houses?.[spaceId] || 0;
        player.houses = { ...player.houses, [spaceId]: current + 1 };
        game.lastAction = `${player.name} built a house on ${space.name}`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('build_hotel', async ({ spaceId }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        if (!canBuildHotel(player, spaceId, game)) return callback({ success: false, error: 'Cannot build hotel here' });
        const space = SPACES[spaceId];
        player.cash -= space.buildCost;
        player.houses = { ...player.houses, [spaceId]: 0 };
        player.hotels = { ...player.hotels, [spaceId]: true };
        game.lastAction = `${player.name} built a hotel on ${space.name}`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('sell_house', async ({ spaceId }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        if (!canSellHouse(player, spaceId, game)) return callback({ success: false, error: 'Cannot sell house - must sell evenly across color group' });
        const space = SPACES[spaceId];
        const refund = Math.floor(space.buildCost / 2);
        player.cash += refund;
        const current = player.houses?.[spaceId] || 0;
        player.houses = { ...player.houses, [spaceId]: current - 1 };
        game.lastAction = `${player.name} sold a house on ${space.name} for $${refund}`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('mortgage', async ({ spaceId }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        if (!player.properties.includes(spaceId)) return callback({ success: false, error: "You don't own this" });
        const space = SPACES[spaceId];
        if (!space) return callback({ success: false, error: 'Invalid space' });
        if (space.type === 'property' && space.group && hasBuildingsInGroup(player, spaceId)) {
          return callback({ success: false, error: 'Must sell all buildings on this color group first' });
        }
        player.mortgaged = player.mortgaged || [];
        if (player.mortgaged.includes(spaceId)) return callback({ success: false, error: 'Already mortgaged' });
        const mortgageValue = Math.floor(space.price / 2);
        player.cash += mortgageValue;
        player.mortgaged.push(spaceId);
        game.lastAction = `${player.name} mortgaged ${space.name} for $${mortgageValue}`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('unmortgage', async ({ spaceId }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        player.mortgaged = player.mortgaged || [];
        if (!player.mortgaged.includes(spaceId)) return callback({ success: false, error: 'Not mortgaged' });
        const space = SPACES[spaceId];
        if (!space) return callback({ success: false, error: 'Invalid space' });
        const base = Math.floor(space.price / 2);
        const unmortgageCost = Math.ceil(base + base * 0.1);
        if (player.cash < unmortgageCost) return callback({ success: false, error: 'Not enough cash' });
        player.cash -= unmortgageCost;
        player.mortgaged = player.mortgaged.filter(p => p !== spaceId);
        game.lastAction = `${player.name} unmortgaged ${space.name} for $${unmortgageCost}`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('pay_jail_bail', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player || !player.inJail) return callback({ success: false, error: 'Not in jail' });
        if (player.cash < JAIL_BAIL) return callback({ success: false, error: 'Not enough cash' });
        player.cash -= JAIL_BAIL;
        player.inJail = false;
        player.jailTurns = 0;
        game.lastAction = `${player.name} paid $${JAIL_BAIL} to get out of jail`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('use_jail_card', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player || !player.inJail) return callback({ success: false, error: 'Not in jail' });
        if (player.getOutOfJailCards <= 0) return callback({ success: false, error: 'No jail cards' });
        player.getOutOfJailCards--;
        player.inJail = false;
        player.jailTurns = 0;
        game.lastAction = `${player.name} used a Get Out of Jail Free card`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('propose_trade', async ({ targetId, offer, request }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        const target = game.players.find(p => p.id === targetId);
        if (!player || !target) return callback({ success: false, error: 'Player not found' });
        const error = validateTradeAssets(game, player, offer) || validateTradeAssets(game, target, request);
        if (error) return callback({ success: false, error });
        io.to(target.socketId).emit('trade_proposal', {
          fromId: currentPlayerId,
          fromName: player.name,
          offer,
          request,
        });
        callback({ success: true });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('accept_trade', async ({ fromId, offer, request }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        const fromPlayer = game.players.find(p => p.id === fromId);
        if (!player || !fromPlayer) return callback({ success: false, error: 'Player not found' });

        const error = validateTradeAssets(game, fromPlayer, offer) || validateTradeAssets(game, player, request);
        if (error) return callback({ success: false, error });

        const offerMortgageFee = calcMortgageInterest(offer, fromPlayer, player);
        const requestMortgageFee = calcMortgageInterest(request, player, fromPlayer);
        if (player.cash < offerMortgageFee) return callback({ success: false, error: `Need $${offerMortgageFee} for 10% mortgage transfer fee` });
        if (fromPlayer.cash < requestMortgageFee) return callback({ success: false, error: `Need $${requestMortgageFee} for 10% mortgage transfer fee` });

        execTrade(game, fromPlayer, player, offer, request);
        game.lastAction = `${fromPlayer.name} and ${player.name} completed a trade`;
        await updateGame(game.roomCode, { players: game.players, lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('decline_trade', async ({ fromId }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        const fromPlayer = game.players.find(p => p.id === fromId);
        if (!player || !fromPlayer) return callback({ success: false, error: 'Player not found' });
        game.lastAction = `${player.name} declined a trade from ${fromPlayer.name}`;
        await updateGame(game.roomCode, { lastAction: game.lastAction });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('chat_message', async ({ text }, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        const msg = { playerId: player.id, playerName: player.name, text: text.slice(0, 200), timestamp: new Date() };
        game.chat = [...(game.chat || []), msg];
        await updateGame(game.roomCode, { chat: game.chat });
        io.to(currentRoom).emit('chat_message', msg);
        callback({ success: true });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('draw_card', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });
        const space = SPACES[player.position];
        if (!space) return callback({ success: false, error: 'Invalid space' });

        let card;
        if (space.type === 'community_chest') {
          const deck = COMMUNITY_CHEST;
          card = deck[Math.floor(Math.random() * deck.length)];
        } else if (space.type === 'chance') {
          const deck = CHANCE;
          card = deck[Math.floor(Math.random() * deck.length)];
        } else {
          return callback({ success: false, error: 'Not a card space' });
        }

        handleCardAction(game, player, card, io);
        await updateGame(game.roomCode, {
          players: game.players,
          lastAction: game.lastAction,
          freeParkingPool: game.freeParkingPool,
        });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        io.to(currentRoom).emit('card_drawn', { card, playerName: player.name });
        callback({ success: true, card, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('declare_bankruptcy', async (_, callback) => {
      try {
        const game = await getGame(currentRoom);
        if (!game) return callback({ success: false, error: 'Game not found' });
        const player = game.players.find(p => p.id === currentPlayerId);
        if (!player) return callback({ success: false, error: 'Player not found' });

        const space = SPACES[player.position];
        let owner = null;
        if (space && ['property', 'railroad', 'utility'].includes(space.type)) {
          owner = game.players.find(p => p.properties.includes(player.position) && !p.isBankrupt);
        }

        player.isBankrupt = true;
        player.properties.forEach(pid => {
          if (owner) owner.properties.push(pid);
        });
        if (owner) owner.cash += player.cash;
        player.cash = 0;
        player.properties = [];
        player.houses = {};
        player.hotels = {};

        game.lastAction = `${player.name} declared bankruptcy!`;
        if (checkGameOver(game)) {
          io.to(currentRoom).emit('game_over', { winner: game.winner });
        } else {
          const nextIdx = findNextActivePlayer(game, game.currentTurn);
          game.currentTurn = nextIdx;
          game.turnPhase = 'pre_roll';
          game.canRollAgain = false;
          game.players.forEach(p => { p.paidRentThisTurn = false; });
          game.lastAction += ` ${game.players[nextIdx].name}'s turn`;
        }
        await updateGame(game.roomCode, {
          players: game.players, lastAction: game.lastAction, status: game.status,
          winner: game.winner, finishedAt: game.finishedAt,
          currentTurn: game.currentTurn, turnPhase: game.turnPhase, canRollAgain: false,
        });
        io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
        callback({ success: true, game: await getGame(currentRoom) });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('list_rooms', async (callback) => {
      try {
        const games = await listGames();
        const rooms = games.filter(g => g.status === 'waiting' && g.players.length > 0).map(g => ({
          roomCode: g.roomCode,
          hostName: g.hostName,
          playerCount: g.players.length,
          status: g.status,
        }));
        callback({ success: true, rooms });
      } catch (err) {
        typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('disconnect', async () => {
      console.log('Player disconnected:', socket.id);
      if (currentRoom) {
        const game = await getGame(currentRoom);
        if (game) {
          const player = game.players.find(p => p.id === currentPlayerId);
          if (player && player.socketId === socket.id) {
            player.connected = false;
            await updateGame(currentRoom, { players: game.players });
            io.to(currentRoom).emit('game_updated', await getGame(currentRoom));
          }
        }
      }
    });
  });
}

function sendToJail(game, player) {
  player.position = 10;
  player.inJail = true;
  player.jailTurns = 0;
  player.consecutiveDoubles = 0;
}

function handleLanding(game, player, diceTotal, io) {
  const space = SPACES[player.position];
  if (!space) return;

  if (space.type === 'go') {
    // handled by movePlayer passing GO
  } else if (space.type === 'go_to_jail') {
    sendToJail(game, player);
    game.lastAction = `${player.name} landed on Go To Jail!`;
  } else if (space.type === 'tax') {
    game.lastAction = `${player.name} landed on ${space.name}. Tax due: $${space.taxAmount}`;
    io.to(player.socketId).emit('tax_due', { amount: space.taxAmount });
  } else if (space.type === 'community_chest' || space.type === 'chance') {
    game.lastAction = `${player.name} landed on ${space.name}. Draw a card!`;
  } else if (space.type === 'free_parking') {
    if (game.freeParkingPool && game.freeParkingPool > 0) {
      player.cash += game.freeParkingPool;
      game.lastAction = `${player.name} collected $${game.freeParkingPool} from Free Parking!`;
      game.freeParkingPool = 0;
    } else {
      game.lastAction = `${player.name} is resting at Free Parking`;
    }
  } else if (['property', 'railroad', 'utility'].includes(space.type)) {
    const owner = game.players.find(p => p.properties.includes(player.position) && !p.isBankrupt);
    if (owner && owner.id !== player.id) {
      const mortgaged = owner.mortgaged?.includes(player.position);
      if (mortgaged) {
        game.lastAction = `${player.name} landed on ${space.name} but it's mortgaged — no rent`;
      } else {
        const rent = calculateRent(player.position, game);
        game.lastAction = `${player.name} landed on ${space.name} owned by ${owner.name}. Rent: $${rent}`;
        io.to(player.socketId).emit('rent_due', { spaceId: player.position, ownerId: owner.id, rent });
      }
    } else if (!owner) {
      game.lastAction = `${player.name} landed on ${space.name}. Buy for $${space.price} or auction?`;
      io.to(player.socketId).emit('property_available', { spaceId: player.position, price: space.price });
    }
  }
}

function handleCardAction(game, player, card, io) {
  let moved = false;
  if (card.action === 'collect') {
    player.cash += card.value;
    game.lastAction = `${player.name} drew: ${card.text}`;
  } else if (card.action === 'pay') {
    player.cash -= card.value;
    if (card.value > 0) game.freeParkingPool = (game.freeParkingPool || 0) + card.value;
    game.lastAction = `${player.name} drew: ${card.text}`;
  } else if (card.action === 'advance_to_go') {
    player.position = 0;
    player.cash += GO_SALARY;
    game.lastAction = `${player.name} drew: Advance to GO!`;
    moved = true;
  } else if (card.action === 'advance_to') {
    const target = card.value;
    if (target < player.position) player.cash += GO_SALARY;
    player.position = target;
    game.lastAction = `${player.name} advanced to ${SPACES[target].name}`;
    moved = true;
  } else if (card.action === 'advance_nearest_railroad') {
    const railroads = [5, 15, 25, 35];
    let nearest = railroads.find(r => r > player.position) || railroads[0];
    if (player.position > 35) nearest = 5;
    if (nearest < player.position) player.cash += GO_SALARY;
    player.position = nearest;
    game.lastAction = `${player.name} advanced to ${SPACES[nearest].name}`;
    moved = true;
  } else if (card.action === 'advance_nearest_utility') {
    const utils = [12, 28];
    let nearest = utils.find(u => u > player.position) || utils[0];
    if (player.position > 28) nearest = 12;
    if (nearest < player.position) player.cash += GO_SALARY;
    player.position = nearest;
    game.lastAction = `${player.name} advanced to ${SPACES[nearest].name}`;
    moved = true;
  } else if (card.action === 'go_back') {
    player.position = (player.position - card.value + 40) % 40;
    game.lastAction = `${player.name} went back ${card.value} spaces`;
    moved = true;
  } else if (card.action === 'go_to_jail') {
    sendToJail(game, player);
    game.lastAction = `${player.name} drew: Go to Jail!`;
  } else if (card.action === 'get_out_of_jail') {
    player.getOutOfJailCards = (player.getOutOfJailCards || 0) + 1;
    game.lastAction = `${player.name} drew a Get Out of Jail Free card`;
  } else if (card.action === 'collect_from_all') {
    const otherPlayers = game.players.filter(p => p.id !== player.id && !p.isBankrupt);
    let total = 0;
    for (const p of otherPlayers) {
      p.cash -= card.value;
      total += card.value;
    }
    player.cash += total;
    game.lastAction = `${player.name} collected $${total} from other players`;
  } else if (card.action === 'pay_each') {
    const otherPlayers = game.players.filter(p => p.id !== player.id && !p.isBankrupt);
    let total = 0;
    for (const p of otherPlayers) {
      p.cash += card.value;
      total += card.value;
    }
    player.cash -= total;
    game.lastAction = `${player.name} paid $${total} to other players`;
  } else if (card.action === 'street_repair') {
    const cost = calculateStreetRepair(player, card.perHouse, card.perHotel);
    player.cash -= cost;
    game.lastAction = `${player.name} paid $${cost} for street repairs`;
  }
  if (moved) {
    handleLanding(game, player, game.lastDiceTotal || 7, io);
  }
}

function handleBankruptcy(game, player, creditor, debt, io) {
  const assets = calculateAssets(player);
  if (assets >= debt) {
    game.lastAction = `${player.name} must sell/mortgage to pay $${debt}`;
    io.to(player.socketId).emit('forced_sell', { debt, creditorId: creditor?.id || null });
    updateGame(game.roomCode, { lastAction: game.lastAction });
  } else {
    const totalAssets = player.cash + assets;
    if (creditor) creditor.cash += totalAssets;
    player.isBankrupt = true;
    if (creditor && player.properties) {
      player.properties.forEach(pid => {
        if (!creditor.properties.includes(pid)) creditor.properties.push(pid);
      });
      Object.entries(player.houses || {}).forEach(([k, v]) => { creditor.houses[k] = (creditor.houses[k] || 0) + v; });
      Object.entries(player.hotels || {}).forEach(([k, v]) => { if (v) creditor.hotels[k] = true; });
    }
    player.cash = 0;
    player.properties = [];
    player.houses = {};
    player.hotels = {};
    game.lastAction = `${player.name} is bankrupt!`;
    if (checkGameOver(game)) {
      io.to(game.roomCode).emit('game_over', { winner: game.winner });
    }
  }
}

function calcMortgageInterest(assets, giver, receiver) {
  let total = 0;
  (assets.properties || []).forEach(pid => {
    const sp = SPACES[pid];
    if (sp && sp.price && giver.mortgaged?.includes(pid)) {
      total += Math.ceil(Math.floor(sp.price / 2) * 0.1);
    }
  });
  return total;
}

function hasBuildingsInGroup(player, spaceId) {
  const space = SPACES[spaceId];
  if (!space || !space.group) return false;
  const groupProps = SPACES.filter(s => s.group === space.group && s.type === 'property').map(s => s.id);
  return groupProps.some(pid => (player.houses?.[pid] || 0) > 0 || player.hotels?.[pid]);
}

function validateTradeAssets(game, player, assets) {
  if (assets.properties) {
    for (const pid of assets.properties) {
      const space = SPACES[pid];
      if (!space) return 'Invalid property in trade';
      if (space.type === 'property' && space.group && hasBuildingsInGroup(player, pid)) {
        return `Cannot trade ${space.name} — sell all buildings on ${space.group.replace('_', ' ')} first`;
      }
    }
  }
  return null;
}

function execTrade(game, fromPlayer, toPlayer, offer, request) {
  if (offer.cash) {
    fromPlayer.cash -= offer.cash;
    toPlayer.cash += offer.cash;
  }
  if (offer.properties) {
    offer.properties.forEach(pid => {
      fromPlayer.properties = fromPlayer.properties.filter(p => p !== pid);
      toPlayer.properties.push(pid);
    });
  }
  if (offer.jailCards) {
    fromPlayer.getOutOfJailCards -= offer.jailCards;
    toPlayer.getOutOfJailCards += offer.jailCards;
  }
  if (request.cash) {
    toPlayer.cash -= request.cash;
    fromPlayer.cash += request.cash;
  }
  if (request.properties) {
    request.properties.forEach(pid => {
      toPlayer.properties = toPlayer.properties.filter(p => p !== pid);
      fromPlayer.properties.push(pid);
    });
  }
  if (request.jailCards) {
    toPlayer.getOutOfJailCards -= request.jailCards;
    fromPlayer.getOutOfJailCards += request.jailCards;
  }
  const transferMortgage = (propId, from, to) => {
    const sp = SPACES[propId];
    if (sp && sp.price && from.mortgaged?.includes(propId)) {
      from.mortgaged = from.mortgaged.filter(m => m !== propId);
      to.mortgaged = [...(to.mortgaged || []), propId];
      const interest = Math.ceil(Math.floor(sp.price / 2) * 0.1);
      to.cash -= interest;
      game.lastAction += ` (${sp.name} transferred mortgaged — $${interest} interest paid)`;
    }
  };
  (offer.properties || []).forEach(pid => transferMortgage(pid, fromPlayer, toPlayer));
  (request.properties || []).forEach(pid => transferMortgage(pid, toPlayer, fromPlayer));
}

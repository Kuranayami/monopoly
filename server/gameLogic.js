import crypto from 'node:crypto';
import { SPACES, GO_SALARY, JAIL_BAIL, MAX_JAIL_TURNS, MAX_CONSECUTIVE_DOUBLES } from '../shared/constants.js';

const MAX_HOUSES = 32;
const MAX_HOTELS = 12;

export function rollDice() {
  const d1 = crypto.randomInt(1, 7);
  const d2 = crypto.randomInt(1, 7);
  return [d1, d2];
}

export function isDoubles(dice) {
  return dice[0] === dice[1];
}

export function movePlayer(player, steps) {
  const newPos = (player.position + steps) % 40;
  const passedGo = player.position + steps >= 40;
  return { newPos, passedGo };
}

export function calculateRent(spaceId, game, customDiceTotal) {
  const space = SPACES[spaceId];
  if (!space) return 0;
  const owner = game.players.find(p => p.properties.includes(spaceId) && !p.isBankrupt);
  if (!owner) return 0;

  if (owner.mortgaged?.includes(spaceId)) return 0;

  if (space.type === 'property') {
    const houses = owner.houses?.[spaceId] || 0;
    const hasHotel = owner.hotels?.[spaceId];
    if (hasHotel) return space.rent[5];
    if (houses > 0) return space.rent[houses];
    const groupOwned = getGroupOwner(game, space.group);
    if (groupOwned && groupOwned.id === owner.id) {
      return space.rent[0] * 2;
    }
    return space.rent[0];
  }

  if (space.type === 'railroad') {
    const owned = owner.properties.filter(p => SPACES[p]?.type === 'railroad').length;
    return 25 * Math.pow(2, owned - 1);
  }

  if (space.type === 'utility') {
    const owned = owner.properties.filter(p => SPACES[p]?.type === 'utility').length;
    const dt = customDiceTotal ?? game.lastDiceTotal ?? 7;
    if (owned === 1) return 4 * dt;
    return 10 * dt;
  }

  return 0;
}

function getGroupOwner(game, group) {
  const groupProps = SPACES.filter(s => s.group === group && s.type === 'property').map(s => s.id);
  const owner = game.players.find(p =>
    !p.isBankrupt && groupProps.every(propId => p.properties.includes(propId))
  );
  return owner || null;
}

export function playerOwnsFullGroup(player, group) {
  const groupProps = SPACES.filter(s => s.group === group && s.type === 'property').map(s => s.id);
  return groupProps.every(propId => player.properties.includes(propId));
}

function groupHasMortgaged(player, group) {
  const groupProps = SPACES.filter(s => s.group === group && s.type === 'property').map(s => s.id);
  return groupProps.some(pid => (player.mortgaged || []).includes(pid));
}

function usedHouses(game) {
  let total = 0;
  for (const p of game.players) {
    for (const pid of p.properties) {
      total += (p.houses?.[pid] || 0);
    }
  }
  return total;
}

function usedHotels(game) {
  let total = 0;
  for (const p of game.players) {
    for (const pid of p.properties) {
      if (p.hotels?.[pid]) total++;
    }
  }
  return total;
}

export function canBuildHouse(player, spaceId, game) {
  const space = SPACES[spaceId];
  if (!space || space.type !== 'property') return false;
  if (!player.properties.includes(spaceId)) return false;
  if ((player.mortgaged || []).includes(spaceId)) return false;
  if (!playerOwnsFullGroup(player, space.group)) return false;
  if (groupHasMortgaged(player, space.group)) return false;
  if (usedHouses(game) >= MAX_HOUSES) return false;
  const groupProps = SPACES.filter(s => s.group === space.group && s.type === 'property').map(s => s.id);
  const currentHouses = spaceId => (player.houses?.[spaceId] || 0) + (player.hotels?.[spaceId] ? 5 : 0);
  const targetHouses = currentHouses(spaceId);
  for (const pid of groupProps) {
    if (currentHouses(pid) < targetHouses) return false;
  }
  if (targetHouses >= 4) return false;
  return player.cash >= space.buildCost;
}

export function canBuildHotel(player, spaceId, game) {
  const space = SPACES[spaceId];
  if (!space || space.type !== 'property') return false;
  if (!player.properties.includes(spaceId)) return false;
  if ((player.mortgaged || []).includes(spaceId)) return false;
  if (!playerOwnsFullGroup(player, space.group)) return false;
  if (groupHasMortgaged(player, space.group)) return false;
  if (player.hotels?.[spaceId]) return false;
  if ((player.houses?.[spaceId] || 0) < 4) return false;
  if (usedHotels(game) >= MAX_HOTELS) return false;
  const groupProps = SPACES.filter(s => s.group === space.group && s.type === 'property').map(s => s.id);
  for (const pid of groupProps) {
    if (pid === spaceId) continue;
    if ((player.houses?.[pid] || 0) < 4 && !player.hotels?.[pid]) return false;
  }
  return player.cash >= space.buildCost;
}

export function canSellHouse(player, spaceId, game) {
  const space = SPACES[spaceId];
  if (!space || space.type !== 'property') return false;
  const current = player.houses?.[spaceId] || 0;
  if (current <= 0) return false;
  if (!playerOwnsFullGroup(player, space.group)) return true;
  const groupProps = SPACES.filter(s => s.group === space.group && s.type === 'property').map(s => s.id);
  const houseCount = pid => (player.houses?.[pid] || 0) + (player.hotels?.[pid] ? 5 : 0);
  const maxInGroup = Math.max(...groupProps.map(pid => houseCount(pid)));
  const currentCount = houseCount(spaceId);
  if (currentCount < maxInGroup) return false;
  return true;
}

export function calculateStreetRepair(player, perHouse, perHotel) {
  let total = 0;
  for (const pid of player.properties) {
    const space = SPACES[pid];
    if (space?.type === 'property') {
      total += (player.houses?.[pid] || 0) * perHouse;
      total += (player.hotels?.[pid] ? 1 : 0) * perHotel;
    }
  }
  return total;
}

export function calculateAssets(player) {
  let total = player.cash;
  const mortgaged = player.mortgaged || [];
  for (const pid of player.properties) {
    const space = SPACES[pid];
    if (space) {
      total += mortgaged.includes(pid) ? 0 : Math.floor(space.price / 2);
      const houses = player.houses?.[pid] || 0;
      total += houses * (space.buildCost || 0) * 0.5;
      if (player.hotels?.[pid]) {
        total += (space.buildCost || 0) * 0.5;
      }
    }
  }
  total += player.getOutOfJailCards * 50;
  return total;
}

export function findNextActivePlayer(game, afterIndex) {
  const playerCount = game.players.length;
  for (let i = 1; i <= playerCount; i++) {
    const idx = (afterIndex + i) % playerCount;
    const p = game.players[idx];
    if (!p.isBankrupt) return idx;
  }
  return afterIndex;
}

export function checkGameOver(game) {
  const active = game.players.filter(p => !p.isBankrupt);
  if (active.length <= 1) {
    game.status = 'finished';
    game.winner = active[0]?.name || null;
    game.finishedAt = new Date();
    return true;
  }
  return false;
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text } from './elements.jsx';
import { useSocket, useLocalStorage } from './hooks.js';
import Lobby from './components/Lobby.jsx';
import GameScreen from './components/GameScreen.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function App() {
  const { socket, connected } = useSocket(BACKEND_URL);
  const [screen, setScreen] = useState('lobby');
  const [game, setGame] = useState(null);
  const [playerId, setPlayerId] = useLocalStorage('monopoly_player_id', null);
  const [playerName, setPlayerName] = useLocalStorage('monopoly_player_name', '');
  const [playerToken, setPlayerToken] = useLocalStorage('monopoly_player_token', '');
  const [roomCode, setRoomCode] = useLocalStorage('monopoly_room_code', '');
  const [notification, setNotification] = useState(null);
  const [leftGame, setLeftGame] = useState(false);
  const notifTimer = useRef(null);

  const showNotif = useCallback((msg) => {
    setNotification(msg);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onGameUpdated = (g) => setGame(g);
    const onGameOver = ({ winner }) => {
      showNotif(`Game Over! ${winner} wins!`);
    };
    const onChatMessage = (msg) => {};

    socket.on('game_updated', onGameUpdated);
    socket.on('game_over', onGameOver);
    socket.on('chat_message', onChatMessage);

    const tryReconnect = () => {
      if (playerId && roomCode && !leftGame) {
        socket.emit('reconnect_player', { playerId, roomCode }, (res) => {
          if (res && res.success) {
            setGame(res.game);
            setScreen('game');
          }
        });
      }
    };

    socket.on('connect', tryReconnect);
    if (connected) tryReconnect();

    return () => {
      socket.off('game_updated', onGameUpdated);
      socket.off('game_over', onGameOver);
      socket.off('chat_message', onChatMessage);
      socket.off('connect', tryReconnect);
    };
  }, [socket, connected, playerId, roomCode, leftGame, showNotif]);

  const joinGame = useCallback((g, pid) => {
    setGame(g);
    setPlayerId(pid);
    setRoomCode(g.roomCode);
    setLeftGame(false);
    setScreen('game');
  }, [setPlayerId, setRoomCode]);

  const leaveGame = useCallback(() => {
    setLeftGame(true);
    setGame(null);
    setScreen('lobby');
    socket?.emit('leave_room');
  }, [socket]);

  return (
    <View style={{ width: '100%', height: '100dvh', background: '#121212', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {notification && (
        <View style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'rgba(59,130,246,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '12px 24px', animation: 'fade-in-up 0.3s ease' }}>
          <Text style={{ color: '#3B82F6', fontSize: 14, textAlign: 'center' }}>{notification}</Text>
        </View>
      )}
      {screen === 'lobby' && (
        <Lobby
          socket={socket}
          connected={connected}
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerToken={playerToken}
          setPlayerToken={setPlayerToken}
          playerId={playerId}
          onJoinGame={joinGame}
          showNotif={showNotif}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          socket={socket}
          game={game}
          playerId={playerId}
          onLeave={leaveGame}
          showNotif={showNotif}
        />
      )}
    </View>
  );
}

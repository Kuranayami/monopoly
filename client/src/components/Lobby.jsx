import { useState, useEffect } from 'react';
import { View, Text, Button, Input, Scroller } from '../elements.jsx';
import { useWindowSize, useIsMobile, useIsDesktop } from '../hooks.js';
import { TOKENS } from 'shared/constants.js';

const ACCENT = '#3B82F6';

export default function Lobby({ socket, connected, playerName, setPlayerName, playerToken, setPlayerToken, playerId, onJoinGame, showNotif }) {
  const { width } = useWindowSize();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState('create');
  const [joinCode, setJoinCode] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const scale = isMobile ? Math.min(1, width / 480) : Math.min(1.2, width / 1200);
  const cardW = isMobile ? Math.min(380, width * 0.92) : Math.min(640, width * 0.45);

  useEffect(() => {
    if (!socket) return;
    const interval = setInterval(() => {
      socket.emit('list_rooms', (res) => {
        if (res.success) setRooms(res.rooms);
      });
    }, 3000);
    socket.emit('list_rooms', (res) => {
      if (res.success) setRooms(res.rooms);
    });
    return () => clearInterval(interval);
  }, [socket]);

  const handleCreate = () => {
    if (!playerName.trim()) return showNotif('Enter a name');
    if (!playerToken) return showNotif('Pick a token');
    setLoading(true);
    socket.emit('create_room', { playerName: playerName.trim(), token: playerToken }, (res) => {
      setLoading(false);
      if (res.success) {
        setPlayerToken(playerToken);
        onJoinGame(res.game, res.playerId);
      } else {
        showNotif(res.error);
      }
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) return showNotif('Enter a name');
    if (!playerToken) return showNotif('Pick a token');
    if (!joinCode.trim()) return showNotif('Enter room code');
    setLoading(true);
    socket.emit('join_room', { roomCode: joinCode.trim().toUpperCase(), playerName: playerName.trim(), token: playerToken }, (res) => {
      setLoading(false);
      if (res.success) {
        setPlayerToken(playerToken);
        onJoinGame(res.game, res.playerId);
      } else {
        showNotif(res.error);
      }
    });
  };

  const g = (v) => Math.round(v * scale);

  return (
    <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <View style={{
        width: cardW, background: '#1E1E1E', backdropFilter: 'blur(20px)',
        borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: g(32),
        animation: 'fade-in-up 0.5s ease',
      }}>
        <Text style={{ fontSize: g(36), fontWeight: 800, textAlign: 'center', color: '#3B82F6', marginBottom: g(8) }}>
          MONOPOLY
        </Text>
        <Text style={{ fontSize: g(13), color: '#A0A0A0', textAlign: 'center', marginBottom: g(24) }}>
          {connected ? '🟢 Connected' : '🔴 Connecting...'}
        </Text>

        <Text style={{ fontSize: g(13), color: '#A0A0A0', marginBottom: g(6) }}>Your Name</Text>
        <Input
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Enter your name..."
          placeholderTextColor="#A0A0A0"
          style={{
            width: '100%', padding: `${g(12)}px ${g(16)}px`, fontSize: g(15),
            background: '#1E1E1E', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)', color: '#F0F0F0',
            marginBottom: g(20),
          }}
        />

        <Text style={{ fontSize: g(13), color: '#A0A0A0', marginBottom: g(12) }}>Choose Your Token</Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: g(8), marginBottom: g(24) }}>
          {TOKENS.map(t => {
            const selected = playerToken === t;
            return (
              <Button key={t} onPress={() => setPlayerToken(t)}
                style={{
                  padding: `${g(8)}px ${g(14)}px`, borderRadius: 12, fontSize: g(13),
                  background: selected ? ACCENT : '#1E1E1E',
                  border: selected ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: selected ? '#F0F0F0' : '#A0A0A0',
                  fontWeight: selected ? 700 : 400,
                  transition: 'all 0.2s',
                }}>
                {t.replace('_', ' ')}
              </Button>
            );
          })}
        </View>

        <View style={{ display: 'flex', gap: g(8), marginBottom: g(16) }}>
          <Button onPress={() => setTab('create')} style={{
            flex: 1, padding: `${g(10)}px`, borderRadius: 12, fontSize: g(14), fontWeight: 600,
            background: tab === 'create' ? ACCENT : '#1E1E1E',
            color: tab === 'create' ? '#F0F0F0' : '#A0A0A0',
          }}>Create Room</Button>
          <Button onPress={() => setTab('join')} style={{
            flex: 1, padding: `${g(10)}px`, borderRadius: 12, fontSize: g(14), fontWeight: 600,
            background: tab === 'join' ? ACCENT : '#1E1E1E',
            color: tab === 'join' ? '#F0F0F0' : '#A0A0A0',
          }}>Join Room</Button>
        </View>

        {tab === 'create' ? (
          <Button onPress={handleCreate} disabled={loading || !connected}
            style={{
              width: '100%', padding: `${g(14)}px`, borderRadius: 14, fontSize: g(16), fontWeight: 700,
              background: ACCENT, color: '#F0F0F0', boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
            }}>
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        ) : (
          <>
            <Input
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              placeholder="Enter room code..."
              placeholderTextColor="#A0A0A0"
              maxLength={4}
              style={{
                width: '100%', padding: `${g(12)}px ${g(16)}px`, fontSize: g(18),
                textAlign: 'center', letterSpacing: g(4),
                background: '#1E1E1E', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)', color: '#F0F0F0',
                marginBottom: g(12),
              }}
            />
            <Button onPress={handleJoin} disabled={loading || !connected}
              style={{
                width: '100%', padding: `${g(14)}px`, borderRadius: 14, fontSize: g(16), fontWeight: 700,
                background: ACCENT, color: '#F0F0F0', boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                marginBottom: g(16),
              }}>
              {loading ? 'Joining...' : 'Join Room'}
            </Button>
          </>
        )}

        {rooms.length > 0 && tab === 'join' && (
          <>
            <Text style={{ fontSize: g(12), color: '#A0A0A0', marginBottom: g(8) }}>Available Rooms</Text>
            <Scroller style={{ maxHeight: g(150) }}>
              {rooms.map(r => (
                <Button key={r.roomCode} onPress={() => setJoinCode(r.roomCode)}
                  style={{
                    width: '100%', padding: `${g(8)}px ${g(12)}px`, borderRadius: 10,
                    background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: g(6), display: 'flex', justifyContent: 'space-between',
                  }}>
                  <Text style={{ fontSize: g(13), color: '#3B82F6', fontWeight: 600 }}>{r.roomCode}</Text>
                  <Text style={{ fontSize: g(12), color: '#A0A0A0' }}>{r.hostName} • {r.playerCount}/6</Text>
                </Button>
              ))}
            </Scroller>
          </>
        )}
      </View>
    </View>
  );
}

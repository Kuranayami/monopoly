import { useState, useRef, useEffect } from 'react';
import { View, Text, Input, Button, Scroller } from '../elements.jsx';

export default function ChatPanel({ game, playerId, socket }) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  const messages = game?.chat || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = () => {
    if (!text.trim() || !socket) return;
    socket.emit('chat_message', { text: text.trim() });
    setText('');
  };

  return (
    <View style={{
      display: 'flex', flexDirection: 'column',
      background: '#1E1E1E', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', flex: 1,
    }}>
      <Text style={{
        fontSize: 13, fontWeight: 700, color: '#A0A0A0',
        textTransform: 'uppercase', letterSpacing: 1,
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        Chat
      </Text>
      <Scroller ref={scrollRef} style={{ flex: 1, padding: '8px 16px', minHeight: 0 }}>
        {messages.length === 0 && (
          <Text style={{ fontSize: 12, color: '#A0A0A0', textAlign: 'center', paddingTop: 20 }}>
            No messages yet
          </Text>
        )}
        {messages.map((m, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: m.playerId === playerId ? '#3B82F6' : '#A0A0A0', fontWeight: 600 }}>
              {m.playerName}
            </Text>
            <Text style={{ fontSize: 13, color: '#F0F0F0' }}>{m.text}</Text>
          </View>
        ))}
      </Scroller>
      <View style={{
        display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 12px', gap: 8,
      }}>
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#A0A0A0"
          onSubmitEditing={send}
          style={{
            flex: 1, padding: '8px 12px', fontSize: 13,
            background: '#1E1E1E', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)', color: '#F0F0F0',
          }}
        />
        <Button onPress={send}
          style={{
            padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            flexShrink: 0, whiteSpace: 'nowrap',
            background: '#3B82F6',
            color: '#F0F0F0',
          }}>
          Send
        </Button>
      </View>
    </View>
  );
}

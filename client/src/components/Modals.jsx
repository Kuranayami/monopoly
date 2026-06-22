import { useState } from 'react';
import { View, Text, Button, Input, Overlay, Scroller } from '../elements.jsx';
import { SPACES, CHANCE, COMMUNITY_CHEST } from 'shared/constants.js';

const GOLD = 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)';

export function CardModal({ card, onClose }) {
  if (!card) return null;
  return (
    <Overlay onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <View onClick={e => e.stopPropagation()} style={{
        animation: 'modal-enter 0.3s ease',
        background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        padding: 32, maxWidth: 360, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <Text style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, textAlign: 'center' }}>
          Card
        </Text>
        <Text style={{ fontSize: 18, color: '#fff', textAlign: 'center', lineHeight: 1.5, marginBottom: 20 }}>
          {card.text}
        </Text>
        <Button onPress={onClose}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: GOLD, color: '#060612',
          }}>
          OK
        </Button>
      </View>
    </Overlay>
  );
}

export function PropertyModal({ spaceId, onBuy, onAuction, game, playerId }) {
  if (spaceId === null || spaceId === undefined) return null;
  const space = SPACES[spaceId];
  if (!space) return null;
  const player = game?.players?.find(p => p.id === playerId);
  const canAfford = player && player.cash >= space.price;

  return (
    <Overlay style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <View onClick={e => e.stopPropagation()} style={{
        animation: 'modal-enter 0.3s ease',
        background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        padding: 32, maxWidth: 360, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {space.color && (
          <View style={{ height: 6, background: space.color, borderRadius: 3, marginBottom: 16 }} />
        )}
        <Text style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{space.name}</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
          {space.group?.replace('_', ' ')} • Price: ${space.price}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Your cash: ${player?.cash || 0}</Text>
        <View style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button onPress={canAfford ? onBuy : null}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: canAfford ? GOLD : 'rgba(255,255,255,0.04)',
              color: canAfford ? '#060612' : 'rgba(255,255,255,0.3)',
            }}>
            {canAfford ? `Buy $${space.price}` : 'Can\'t Afford'}
          </Button>
          <Button onPress={onAuction}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
            Auction
          </Button>
        </View>
      </View>
    </Overlay>
  );
}

export function AuctionModal({ auction, game, playerId, socket }) {
  const [bidInput, setBidInput] = useState('');
  if (!auction || auction.spaceId === null || auction.spaceId === undefined) return null;
  const space = SPACES[auction.spaceId];
  const player = game?.players?.find(p => p.id === playerId);
  const myBid = auction.bidders?.[playerId] || 0;
  const canBid = player && parseInt(bidInput) > auction.currentBid && parseInt(bidInput) <= player.cash;

  const placeBid = () => {
    const amount = parseInt(bidInput);
    if (isNaN(amount) || amount <= auction.currentBid) return;
    if (amount > (player?.cash || 0)) return;
    socket?.emit('auction_bid', { bid: amount });
    setBidInput('');
  };

  const endAuction = () => {
    socket?.emit('end_auction');
  };

  const highestBidder = auction.currentBidder
    ? game?.players?.find(p => p.id === auction.currentBidder)
    : null;

  return (
    <Overlay style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <View style={{
        animation: 'modal-enter 0.3s ease',
        background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        padding: 32, maxWidth: 360, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <Text style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Auction</Text>
        <Text style={{ fontSize: 14, color: '#fbbf24', marginBottom: 4 }}>{space?.name}</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
          Starting price: ${space?.price || 0}
        </Text>

        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
          Current bid: <Text style={{ color: '#fbbf24', fontWeight: 700 }}>${auction.currentBid}</Text>
        </Text>
        {highestBidder && (
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
            Highest bidder: {highestBidder.name}
          </Text>
        )}

        <View style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            value={bidInput}
            onChangeText={setBidInput}
            keyboardType="numeric"
            placeholder={`Bid (min $${(auction.currentBid || 0) + 1})`}
            placeholderTextColor="rgba(255,255,255,0.2)"
            style={{
              flex: 1, padding: '10px 14px', fontSize: 14,
              background: 'rgba(255,255,255,0.04)', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
            }}
          />
          <Button onPress={placeBid}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: canBid ? GOLD : 'rgba(255,255,255,0.04)',
              color: canBid ? '#060612' : 'rgba(255,255,255,0.3)',
            }}>
            Bid
          </Button>
        </View>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
          Your cash: ${player?.cash || 0} • Your bid: ${myBid}
        </Text>

        <Button onPress={endAuction}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
          Close Auction
        </Button>
      </View>
    </Overlay>
  );
}

export function RentModal({ spaceId, rent, onPay, onBankrupt, game, playerId }) {
  const space = SPACES[spaceId];
  const player = game?.players?.find(p => p.id === playerId);
  if (!space || !player) return null;

  return (
    <Overlay style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <View style={{
        animation: 'modal-enter 0.3s ease',
        background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        padding: 32, maxWidth: 360, width: '90%',
      }}>
        <Text style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Rent Due!</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
          {space.name}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginBottom: 16 }}>
          ${rent}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
          Your cash: ${player.cash}
        </Text>
        <View style={{ display: 'flex', gap: 8 }}>
          <Button onPress={onPay}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: GOLD, color: '#060612',
            }}>
            {player.cash >= rent ? `Pay $${rent}` : 'Pay (Will go negative)'}
          </Button>
          <Button onPress={onBankrupt}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'rgba(239,68,68,0.15)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)',
            }}>
            Declare Bankruptcy
          </Button>
        </View>
      </View>
    </Overlay>
  );
}

export function BuildingsModal({ spaceId, onBuildHouse, onBuildHotel, onSell, onMortgage, onUnmortgage, onClose, game, playerId }) {
  if (spaceId === null || spaceId === undefined) return null;
  const space = SPACES[spaceId];
  const player = game?.players?.find(p => p.id === playerId);
  if (!space || !player) return null;
  const houses = player.houses?.[spaceId] || 0;
  const hasHotel = player.hotels?.[spaceId];
  const canBuild = space.type === 'property';
  const isMortgaged = player.mortgaged?.includes(spaceId);
  const mortgageValue = space.price ? Math.floor(space.price / 2) : 0;

  return (
    <Overlay onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <View onClick={e => e.stopPropagation()} style={{
        animation: 'modal-enter 0.3s ease',
        background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        padding: 32, maxWidth: 360, width: '90%',
      }}>
        {space.color && (
          <View style={{ height: 6, background: space.color, borderRadius: 3, marginBottom: 16 }} />
        )}
        <Text style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{space.name}</Text>
        {canBuild && (
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            {hasHotel ? '\u{1F3E8}' : '\u{1F3E0}'.repeat(houses || 0)} {hasHotel ? 'Hotel' : `${houses} house${houses !== 1 ? 's' : ''}`} • Build Cost: ${space.buildCost}
          </Text>
        )}
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
          Your cash: ${player.cash}
        </Text>
        {canBuild && (
          <View style={{ display: 'flex', gap: 8 }}>
            {!hasHotel && houses < 4 && (
              <Button onPress={() => { onBuildHouse(spaceId); onClose(); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: GOLD, color: '#060612',
                }}>
                Build House (${space.buildCost})
              </Button>
            )}
            {houses >= 4 && !hasHotel && (
              <Button onPress={() => { onBuildHotel(spaceId); onClose(); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff',
                }}>
                Build Hotel (${space.buildCost})
              </Button>
            )}
            {houses > 0 && (
              <Button onPress={() => { onSell(spaceId); onClose(); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                Sell House (${Math.floor(space.buildCost / 2)})
              </Button>
            )}
          </View>
        )}
        {space.price > 0 && (
          <View style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {!isMortgaged && (
              <Button onPress={() => { onMortgage(spaceId); onClose(); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}>
                Mortgage (${mortgageValue})
              </Button>
            )}
            {isMortgaged && (
              <Button onPress={() => { onUnmortgage(spaceId); onClose(); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.3)',
                }}>
                Unmortgage (${Math.ceil(mortgageValue + mortgageValue * 0.1)})
              </Button>
            )}
          </View>
        )}
        <Button onPress={onClose}
          style={{
            width: '100%', padding: '10px', borderRadius: 12, fontSize: 13,
            background: 'transparent', color: 'rgba(255,255,255,0.4)', marginTop: 8,
          }}>
          Close
        </Button>
      </View>
    </Overlay>
  );
}

export function TradeModal({ game, playerId, socket, onClose }) {
  const [step, setStep] = useState('select');
  const [targetId, setTargetId] = useState(null);
  const [offer, setOffer] = useState({ cash: 0, properties: [], jailCards: 0 });
  const [request, setRequest] = useState({ cash: 0, properties: [], jailCards: 0 });

  const player = game?.players?.find(p => p.id === playerId);
  const others = game?.players?.filter(p => p.id !== playerId && !p.isBankrupt) || [];

  const handlePropose = () => {
    if (!targetId) return;
    socket?.emit('propose_trade', { targetId, offer, request });
    onClose();
  };

  const toggleOfferProp = (pid) => {
    setOffer(o => ({
      ...o,
      properties: o.properties.includes(pid) ? o.properties.filter(p => p !== pid) : [...o.properties, pid],
    }));
  };

  const toggleRequestProp = (pid) => {
    setRequest(o => ({
      ...o,
      properties: o.properties.includes(pid) ? o.properties.filter(p => p !== pid) : [...o.properties, pid],
    }));
  };

  return (
    <Overlay onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <View onClick={e => e.stopPropagation()} style={{
        animation: 'modal-enter 0.3s ease',
        background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        padding: 24, maxWidth: 400, width: '90%', maxHeight: '80vh',
      }}>
        <Text style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Trade</Text>

        {step === 'select' && (
          <>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Select player to trade with:</Text>
            {others.map(p => (
              <Button key={p.id} onPress={() => { setTargetId(p.id); setStep('details'); }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 14,
                  background: 'rgba(255,255,255,0.04)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8,
                  textAlign: 'left',
                }}>
                {p.name} (${p.cash})
              </Button>
            ))}
          </>
        )}

        {step === 'details' && (
          <Scroller style={{ maxHeight: '60vh' }}>
            <Text style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginBottom: 8 }}>
              You give:
            </Text>
            <View style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {player?.properties?.map(pid => {
                const s = SPACES[pid];
                const selected = offer.properties.includes(pid);
                return (
                  <Button key={pid} onPress={() => toggleOfferProp(pid)}
                    style={{
                      padding: '4px 8px', borderRadius: 8, fontSize: 11,
                      background: selected ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                      border: selected ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                      color: selected ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    {s?.color && <View style={{ width: 6, height: 14, borderRadius: 2, background: s.color, flexShrink: 0 }} />}
                    {s?.name || `Space ${pid}`}
                    {player?.mortgaged?.includes(pid) && <Text style={{ fontSize: 9, color: '#ef4444' }}> (M)</Text>}
                  </Button>
                );
              })}
            </View>
            <Input
              value={offer.cash === 0 ? '' : String(offer.cash)}
              onChangeText={v => setOffer({ ...offer, cash: parseInt(v) || 0 })}
              keyboardType="numeric" placeholder="Cash to give"
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 8,
                background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
              }}
            />
            <Input
              value={offer.jailCards === 0 ? '' : String(offer.jailCards)}
              onChangeText={v => setOffer({ ...offer, jailCards: parseInt(v) || 0 })}
              keyboardType="numeric" placeholder="Jail cards to give"
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 16,
                background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
              }}
            />

            <Text style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginBottom: 8 }}>
              You receive:
            </Text>
            <View style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {others.find(p => p.id === targetId)?.properties?.map(pid => {
                const target = others.find(p => p.id === targetId);
                const s = SPACES[pid];
                const selected = request.properties.includes(pid);
                return (
                  <Button key={pid} onPress={() => toggleRequestProp(pid)}
                    style={{
                      padding: '4px 8px', borderRadius: 8, fontSize: 11,
                      background: selected ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                      border: selected ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                      color: selected ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    {s?.color && <View style={{ width: 6, height: 14, borderRadius: 2, background: s.color, flexShrink: 0 }} />}
                    {s?.name || `Space ${pid}`}
                    {target?.mortgaged?.includes(pid) && <Text style={{ fontSize: 9, color: '#ef4444' }}> (M)</Text>}
                  </Button>
                );
              })}
            </View>
            <Input
              value={request.cash === 0 ? '' : String(request.cash)}
              onChangeText={v => setRequest({ ...request, cash: parseInt(v) || 0 })}
              keyboardType="numeric" placeholder="Cash to receive"
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 8,
                background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
              }}
            />
            <Input
              value={request.jailCards === 0 ? '' : String(request.jailCards)}
              onChangeText={v => setRequest({ ...request, jailCards: parseInt(v) || 0 })}
              keyboardType="numeric" placeholder="Jail cards to receive"
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 16,
                background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
              }}
            />

            <Button onPress={handlePropose}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#060612',
              }}>
              Propose Trade
            </Button>
          </Scroller>
        )}
      </View>
    </Overlay>
  );
}

export function PlayerPropsModal({ game, playerId, onClose, onSelectProp }) {
  const player = game?.players?.find(p => p.id === playerId);
  if (!player || player.properties.length === 0) return null;

  return (
    <Overlay onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <View onClick={e => e.stopPropagation()} style={{
        animation: 'modal-enter 0.3s ease',
        background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        padding: 24, maxWidth: 360, width: '90%', maxHeight: '70vh',
      }}>
        <Text style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          {player.name}'s Properties
        </Text>
        {player.getOutOfJailCards > 0 && (
          <Text style={{ fontSize: 12, color: '#fbbf24', marginBottom: 10 }}>
            🃏 {player.getOutOfJailCards} Get Out of Jail Free Card{player.getOutOfJailCards > 1 ? 's' : ''}
          </Text>
        )}
        <Scroller style={{ maxHeight: '50vh' }}>
          {player.properties.map(pid => {
            const s = SPACES[pid];
            return (
              <Button key={pid} onPress={() => { onSelectProp?.(pid); onClose?.(); }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: 6, color: '#fff', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                <Text style={{ fontSize: 13, color: '#fff' }}>{s?.name}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  {player.hotels?.[pid] ? '\u{1F3E8}' : '\u{1F3E0}'.repeat(player.houses?.[pid] || 0)}
                </Text>
              </Button>
            );
          })}
        </Scroller>
        <Button onPress={onClose}
          style={{ width: '100%', padding: '10px', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8, background: 'transparent' }}>
          Close
        </Button>
      </View>
    </Overlay>
  );
}

export function TradeProposalModal({ proposal, game, playerId, onAccept, onDecline }) {
  if (!proposal) return null;

  const renderAssetList = (assets, label, ownerId) => {
    const owner = game?.players?.find(p => p.id === ownerId);
    return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>{label}</Text>
      {(assets.properties || []).map(pid => {
        const s = SPACES[pid];
        const isMortgaged = owner?.mortgaged?.includes(pid);
        return (
          <View key={pid} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            {s?.color && <View style={{ width: 6, height: 14, borderRadius: 2, background: s.color, flexShrink: 0 }} />}
            <Text style={{ fontSize: 12, color: '#fff' }}>{s?.name || `Space ${pid}`}</Text>
            {isMortgaged && <Text style={{ fontSize: 10, color: '#ef4444' }}>(M)</Text>}
          </View>
        );
      })}
      {assets.cash > 0 && <Text style={{ fontSize: 12, color: '#fff' }}>  ${assets.cash}</Text>}
      {assets.jailCards > 0 && <Text style={{ fontSize: 12, color: '#fff' }}>  {assets.jailCards} Jail Card(s)</Text>}
      {!assets.properties?.length && !assets.cash && !assets.jailCards && (
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>  Nothing</Text>
      )}
    </View>
    );
  };

  return (
    <Overlay style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <View style={{
        animation: 'modal-enter 0.3s ease',
        background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        padding: 24, maxWidth: 360, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <Text style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          Trade from {proposal.fromName}
        </Text>
        {renderAssetList(proposal.offer, `${proposal.fromName} gives:`, proposal.fromId)}
        {renderAssetList(proposal.request, `${proposal.fromName} requests:`, playerId)}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Button onPress={onAccept}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
            }}>
            Accept
          </Button>
          <Button onPress={onDecline}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
            Decline
          </Button>
        </View>
      </View>
    </Overlay>
  );
}

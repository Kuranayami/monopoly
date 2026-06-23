import { useState, useCallback, useEffect } from 'react';
import { View, Text, Button, Scroller, Overlay } from '../elements.jsx';
import { useIsMobile, useIsDesktop, useWindowSize } from '../hooks.js';
import Board from './Board.jsx';
import ZoomBoard from './ZoomBoard.jsx';
import Dice from './Dice.jsx';
import PlayerList from './PlayerList.jsx';
import ChatPanel from './ChatPanel.jsx';
import PropertyCard from './PropertyCard.jsx';
import { CardModal, PropertyModal, AuctionModal, RentModal, BuildingsModal, TradeModal, PlayerPropsModal, TradeProposalModal } from './Modals.jsx';
import { SPACES } from 'shared/constants.js';

export default function GameScreen({ socket, game, playerId, onLeave, showNotif }) {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const { width, height } = useWindowSize();

  const [showChat, setShowChat] = useState(false);
  const [cardModal, setCardModal] = useState(null);
  const [propModal, setPropModal] = useState(null);
  const [auctionModal, setAuctionModal] = useState(null);
  const [rentModal, setRentModal] = useState(null);
  const [buildModal, setBuildModal] = useState(null);
  const [tradeModal, setTradeModal] = useState(false);
  const [tradeProposal, setTradeProposal] = useState(null);
  const [propsModal, setPropsModal] = useState(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [landedOnCard, setLandedOnCard] = useState(false);

  const player = game?.players?.find(p => p.id === playerId);
  const isMyTurn = game?.players?.[game?.currentTurn]?.id === playerId;
  const phase = game?.turnPhase;

  // Listen for game events that trigger modals
  useEffect(() => {
    if (!socket) return;

    const onRentDue = ({ spaceId, ownerId, rent }) => {
      setRentModal({ spaceId, rent });
    };
    const onPropertyAvailable = ({ spaceId, price }) => {
      setPropModal({ spaceId });
    };
    const onCardDrawn = ({ card, playerName }) => {
      setCardModal(card);
      setLandedOnCard(false);
    };
    const onTradeProposal = ({ fromId, fromName, offer, request }) => {
      setTradeProposal({ fromId, fromName, offer, request });
    };
    const onAuctionStarted = (data) => {
      setAuctionModal(data);
    };
    const onAuctionUpdated = (auctionState) => {
      setAuctionModal(prev => prev ? { ...prev, ...auctionState } : prev);
    };
    const onAuctionEnded = () => {
      setAuctionModal(null);
    };
    const onTaxDue = ({ amount }) => {
      setRentModal({ amount, isTax: true });
    };

    socket.on('tax_due', onTaxDue);
    socket.on('rent_due', onRentDue);
    socket.on('property_available', onPropertyAvailable);
    socket.on('card_drawn', onCardDrawn);
    socket.on('trade_proposal', onTradeProposal);
    socket.on('auction_started', onAuctionStarted);
    socket.on('auction_update', onAuctionUpdated);
    socket.on('auction_ended', onAuctionEnded);

    return () => {
      socket.off('tax_due', onTaxDue);
      socket.off('rent_due', onRentDue);
      socket.off('property_available', onPropertyAvailable);
      socket.off('card_drawn', onCardDrawn);
      socket.off('trade_proposal', onTradeProposal);
      socket.off('auction_started', onAuctionStarted);
      socket.off('auction_update', onAuctionUpdated);
      socket.off('auction_ended', onAuctionEnded);
    };
  }, [socket, showNotif]);

  // Detect landing on card spaces
  useEffect(() => {
    if (player && isMyTurn && phase === 'post_roll') {
      const space = SPACES[player.position];
      if (space && (space.type === 'community_chest' || space.type === 'chance')) {
        setLandedOnCard(true);
      } else {
        setLandedOnCard(false);
      }
    } else {
      setLandedOnCard(false);
    }
  }, [player?.position, isMyTurn, phase]);

  const cellSize = 72;

  const handleRoll = useCallback(() => {
    if (!isMyTurn || phase !== 'pre_roll') return;
    setRolling(true);
    setTimeout(() => setRolling(false), 500);
    socket?.emit('roll_dice', (res) => {
      if (!res?.success) showNotif(res?.error || 'Roll failed');
    });
  }, [isMyTurn, phase, socket, showNotif]);

  const handleEndTurn = useCallback(() => {
    socket?.emit('end_turn', (res) => {
      if (res?.rollAgain) {
        setRolling(true);
        setTimeout(() => setRolling(false), 500);
        socket?.emit('roll_dice', (res2) => {
          if (!res2?.success) showNotif(res2?.error || 'Roll failed');
        });
      }
    });
  }, [socket, showNotif]);

  const handleAcceptTrade = useCallback(() => {
    if (!tradeProposal) return;
    socket?.emit('accept_trade', {
      fromId: tradeProposal.fromId,
      offer: tradeProposal.offer,
      request: tradeProposal.request,
    }, (res) => {
      if (res?.success) showNotif('Trade accepted!');
      else showNotif(res?.error || 'Trade failed');
      setTradeProposal(null);
    });
  }, [socket, tradeProposal, showNotif]);

  const handleDeclineTrade = useCallback(() => {
    if (!tradeProposal) return;
    socket?.emit('decline_trade', { fromId: tradeProposal.fromId });
    setTradeProposal(null);
  }, [socket, tradeProposal]);

  const handleBuyProperty = useCallback(() => {
    setPropModal(null);
    socket?.emit('buy_property', (res) => {
      if (res?.success) showNotif('Property purchased!');
      else showNotif(res?.error || 'Cannot buy');
    });
  }, [socket, showNotif]);

  const handleAuction = useCallback(() => {
    if (propModal?.spaceId !== undefined) {
      const spaceId = propModal.spaceId;
      setPropModal(null);
      socket?.emit('start_auction', { spaceId });
    }
  }, [propModal, socket]);

  const handlePayRent = useCallback(() => {
    setRentModal(null);
    socket?.emit('pay_rent');
  }, [socket]);

  const handlePayTax = useCallback(() => {
    setRentModal(null);
    socket?.emit('pay_tax');
  }, [socket]);

  const handleBankrupt = useCallback(() => {
    setRentModal(null);
    socket?.emit('declare_bankruptcy');
  }, [socket]);

  const handleDrawCard = useCallback(() => {
    socket?.emit('draw_card', (res) => {
      if (!res?.success) showNotif(res?.error || 'No card');
    });
  }, [socket, showNotif]);

  const handleBuildHouse = useCallback((spaceId) => {
    socket?.emit('build_house', { spaceId }, (res) => {
      if (!res?.success) showNotif(res?.error || 'Cannot build');
    });
  }, [socket, showNotif]);

  const handleBuildHotel = useCallback((spaceId) => {
    socket?.emit('build_hotel', { spaceId }, (res) => {
      if (!res?.success) showNotif(res?.error || 'Cannot build');
    });
  }, [socket, showNotif]);

  const handleSellHouse = useCallback((spaceId) => {
    socket?.emit('sell_house', { spaceId }, (res) => {
      if (!res?.success) showNotif(res?.error || 'Cannot sell');
    });
  }, [socket, showNotif]);

  const handleMortgage = useCallback((spaceId) => {
    socket?.emit('mortgage', { spaceId }, (res) => {
      if (!res?.success) showNotif(res?.error || 'Cannot mortgage');
    });
  }, [socket, showNotif]);

  const handleUnmortgage = useCallback((spaceId) => {
    socket?.emit('unmortgage', { spaceId }, (res) => {
      if (!res?.success) showNotif(res?.error || 'Cannot unmortgage');
    });
  }, [socket, showNotif]);

  const handleOpenBuildings = useCallback(() => {
    setPropsModal(playerId);
  }, [playerId]);

  const handlePayBail = useCallback(() => {
    socket?.emit('pay_jail_bail', (res) => {
      if (!res?.success) showNotif(res?.error || 'Cannot pay bail');
    });
  }, [socket, showNotif]);

  const handleUseJailCard = useCallback(() => {
    socket?.emit('use_jail_card', (res) => {
      if (!res?.success) showNotif(res?.error || 'Cannot use card');
    });
  }, [socket, showNotif]);

  const handleLeaveClick = useCallback(() => {
    setLeaveConfirm(true);
  }, []);

  const handleLeaveConfirm = useCallback(() => {
    setLeaveConfirm(false);
    onLeave();
  }, [onLeave]);

  const handleLeaveCancel = useCallback(() => {
    setLeaveConfirm(false);
  }, []);

  const handleHostStart = useCallback(() => {
    if (!socket) return showNotif('Socket not connected');
    socket.emit('start_game', (res) => {
      if (!res?.success) showNotif(res?.error || 'Cannot start');
    });
  }, [socket, showNotif]);

  const playerProps = player?.properties || [];
  const myProps = playerProps.map(pid => SPACES[pid]).filter(Boolean);

  const sidePanel = (children) => (
    <View style={{
      width: isDesktop ? 260 : '100%',
      display: 'flex', flexDirection: 'column', gap: 12,
      padding: '12px',
      height: isDesktop ? 'calc(100dvh - 24px)' : 'auto',
    }}>
      {children}
    </View>
  );

  const gameActions = (
    <View style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
      <Dice dice={game?.dice} rolling={rolling} onRoll={handleRoll} canRoll={isMyTurn && phase === 'pre_roll'} />
      {isMyTurn && phase === 'pre_roll' && !game?.dice?.length && player?.inJail && (
        <>
          <Button onPress={handlePayBail}
            style={{ padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
              background: '#3B82F6', color: '#F0F0F0' }}>
            Pay $50 Bail
          </Button>
          {player.getOutOfJailCards > 0 && (
            <Button onPress={handleUseJailCard}
              style={{ padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.1)' }}>
              Use Jail Card ({player.getOutOfJailCards})
            </Button>
          )}
        </>
      )}
      {isMyTurn && phase === 'post_roll' && !landedOnCard && !game?.canRollAgain && (
        <Button onPress={handleEndTurn}
          style={{
            padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: '#3B82F6',
            color: '#F0F0F0', boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}>
          End Turn
        </Button>
      )}
      {isMyTurn && phase === 'post_roll' && !landedOnCard && game?.canRollAgain && (
        <Button onPress={handleEndTurn}
          style={{
            padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: '#3B82F6',
            color: '#F0F0F0', boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            animation: 'pulse-glow 2s infinite',
          }}>
          Roll Again
        </Button>
      )}
      {isMyTurn && phase === 'post_roll' && landedOnCard && (
        <Button onPress={handleDrawCard}
          style={{
            padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: '#3B82F6',
            color: '#F0F0F0', boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            animation: 'pulse-glow 2s infinite',
          }}>
          Draw Card
        </Button>
      )}
    </View>
  );

  if (!game) return null;

  if (game.status === 'waiting') {
    return (
      <>
        <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{
            width: isMobile ? '92%' : 400,
            background: '#1E1E1E', backdropFilter: 'blur(20px)',
            borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)',
            padding: 32, animation: 'fade-in-up 0.5s ease',
          }}>
            <Text style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', color: '#3B82F6', marginBottom: 4 }}>
              Room: {game.roomCode}
            </Text>
            <Text style={{ fontSize: 13, color: '#A0A0A0', textAlign: 'center', marginBottom: 20 }}>
              Waiting for players... {game.players.length}/6
            </Text>
            <View style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {game.players.map(p => (
                <View key={p.id} style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <Text style={{ fontSize: 14, color: '#F0F0F0', fontWeight: 600 }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: '#A0A0A0' }}>{p.token}</Text>
                </View>
              ))}
            </View>
            {game.hostName === player?.name && game.players.length >= 2 && (
              <Button onPress={handleHostStart}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, fontSize: 16, fontWeight: 700,
                  background: '#3B82F6',
                  color: '#F0F0F0', boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                  animation: 'pulse-glow 2s infinite',
                }}>
                Start Game
              </Button>
            )}
            <Button onPress={handleLeaveClick}
              style={{
                width: '100%', padding: '10px', borderRadius: 12, fontSize: 13,
                background: 'transparent', color: '#A0A0A0', marginTop: 8,
              }}>
              Leave Room
            </Button>
          </View>
        </View>
        {leaveConfirm && (
          <Overlay>
            <View style={{
              background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)',
              borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
              padding: 24, maxWidth: 300, width: '90%', textAlign: 'center',
            }}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>Leave game?</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Are you sure?</Text>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <Button onPress={handleLeaveConfirm}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#3B82F6', color: '#F0F0F0' }}>
                  Leave
                </Button>
                <Button onPress={handleLeaveCancel}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#F0F0F0' }}>
                  Cancel
                </Button>
              </View>
            </View>
          </Overlay>
        )}
      </>
    );
  }

  if (game.status === 'finished') {
    return (
      <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          background: '#1E1E1E', backdropFilter: 'blur(20px)',
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)',
          padding: 40, textAlign: 'center',
          animation: 'fade-in-up 0.5s ease',
        }}>
          <Text style={{ fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
            Game Over!
          </Text>
          <Text style={{ fontSize: 20, color: '#F0F0F0', marginBottom: 20 }}>
            {game.winner} wins!
          </Text>
          <Button onPress={onLeave}
            style={{ padding: '14px 32px', borderRadius: 14, fontSize: 16, fontWeight: 700, background: '#3B82F6', color: '#F0F0F0' }}>
            Back to Lobby
          </Button>
        </View>
      </View>
    );
  }

  if (isMobile) {
    return (
      <View style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <View style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px',
          background: '#1E1E1E', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: 700 }}>{game.roomCode}</Text>
          <Text style={{ fontSize: 11, color: '#A0A0A0' }}>Turn: {game.players[game.currentTurn]?.name}</Text>
          <View style={{ display: 'flex', gap: 8 }}>
            <Button onPress={() => setShowChat(!showChat)}
              style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, background: '#1E1E1E', color: '#F0F0F0' }}>
              {showChat ? 'Board' : 'Chat'}
            </Button>
            <Button onPress={handleLeaveClick}
              style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, background: '#1E1E1E', color: '#A0A0A0' }}>
              Leave
            </Button>
          </View>
        </View>

        {showChat ? (
          <View style={{ flex: 1, padding: 12 }}>
            <PlayerList game={game} playerId={playerId} />
            <View style={{ height: 12 }} />
            <ChatPanel game={game} playerId={playerId} socket={socket} />
          </View>
        ) : (
          <>
            <View style={{ height: 'calc(100dvh - 200px)', overflow: 'hidden' }}>
              <ZoomBoard>
                <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
                  <Board game={game} playerId={playerId} cellSize={cellSize} dice={game?.dice} rolling={rolling} />
                  <View style={{ padding: '0 12px' }}>
                    <PlayerList game={game} playerId={playerId} />
                  </View>
                </View>
              </ZoomBoard>
            </View>

            <View style={{
              background: '#1E1E1E', backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '8px 12px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            }}>
              {gameActions}
              <View style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                {isMyTurn && phase === 'post_roll' && (
                  <Button onPress={handleBuyProperty}
                    style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Buy Property
                  </Button>
                )}
                <Button onPress={() => setPropsModal(playerId)}
                  style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.06)' }}>
                  My Props ({playerProps.length})
                </Button>
                <Button onPress={() => setTradeModal(true)}
                  style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.06)' }}>
                  Trade
                </Button>
              </View>
            </View>
          </>
        )}

        {cardModal && <CardModal card={cardModal} onClose={() => setCardModal(null)} />}
        {propModal && <PropertyModal spaceId={propModal.spaceId} onBuy={handleBuyProperty} onAuction={handleAuction} game={game} playerId={playerId} />}
        {auctionModal && <AuctionModal auction={auctionModal} game={game} playerId={playerId} socket={socket} />}
        {rentModal && <RentModal spaceId={rentModal.spaceId} rent={rentModal.rent} amount={rentModal.amount} isTax={rentModal.isTax} onPay={rentModal.isTax ? handlePayTax : handlePayRent} onBankrupt={handleBankrupt} game={game} playerId={playerId} onOpenBuildings={handleOpenBuildings} />}
        {buildModal && <BuildingsModal {...buildModal} onBuildHouse={handleBuildHouse} onBuildHotel={handleBuildHotel} onSell={handleSellHouse} onMortgage={handleMortgage} onUnmortgage={handleUnmortgage} onClose={() => setBuildModal(null)} game={game} playerId={playerId} />}
        {tradeModal && <TradeModal game={game} playerId={playerId} socket={socket} onClose={() => setTradeModal(false)} />}
        {tradeProposal && <TradeProposalModal proposal={tradeProposal} game={game} playerId={playerId} onAccept={handleAcceptTrade} onDecline={handleDeclineTrade} />}
        {propsModal && <PlayerPropsModal game={game} playerId={propsModal} onClose={() => setPropsModal(null)} onSelectProp={(pid) => setBuildModal({ spaceId: pid })} />}
        {leaveConfirm && (
          <Overlay>
            <View style={{
              background: '#1E1E1E', backdropFilter: 'blur(20px)',
              borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
              padding: 24, maxWidth: 300, width: '90%', textAlign: 'center',
            }}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>Leave game?</Text>
              <Text style={{ fontSize: 13, color: '#A0A0A0', marginBottom: 16 }}>Are you sure?</Text>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <Button onPress={handleLeaveConfirm}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#3B82F6', color: '#F0F0F0' }}>
                  Leave
                </Button>
                <Button onPress={handleLeaveCancel}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </Button>
              </View>
            </View>
          </Overlay>
        )}
      </View>
    );
  }

  // Desktop 3-column
  return (
    <View style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: 12, gap: 12, height: '100dvh' }}>
      {sidePanel(
        <>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: 800, color: '#3B82F6' }}>{game.roomCode}</Text>
            <Button onPress={handleLeaveClick} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, background: '#1E1E1E', color: '#A0A0A0' }}>Leave</Button>
          </View>
          <PlayerList game={game} playerId={playerId} />
          <View style={{ height: 8 }} />
          <View style={{ background: '#1E1E1E', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
            <Text style={{ fontSize: 12, color: '#A0A0A0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Last Action</Text>
            <Text style={{ fontSize: 13, color: '#F0F0F0' }}>{game.lastAction || 'Game started'}</Text>
          </View>
        </>
      )}

      <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, overflow: 'hidden' }}>
        <ZoomBoard>
          <Board game={game} playerId={playerId} cellSize={cellSize} dice={game?.dice} rolling={rolling} />
        </ZoomBoard>
        {gameActions}
        <View style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {isMyTurn && phase === 'post_roll' && (
            <Button onPress={handleBuyProperty} style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.06)' }}>Buy Property</Button>
          )}
          <Button onPress={() => setPropsModal(playerId)} style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.06)' }}>My Props ({playerProps.length})</Button>
          <Button onPress={() => setTradeModal(true)} style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.06)' }}>Trade</Button>
        </View>
      </View>

      {sidePanel(
        <>
          <ChatPanel game={game} playerId={playerId} socket={socket} />
          <View style={{ height: 8 }} />
          <View style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#1E1E1E', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
            <Text style={{ fontSize: 12, color: '#A0A0A0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>My Properties ({myProps.length})</Text>
            <Scroller style={{ flex: 1, minHeight: 0 }}>
              <View style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {myProps.map(s => (
                  <Button key={s.id} onPress={() => setBuildModal({ spaceId: s.id })} style={{ textAlign: 'left', width: '100%' }}>
                    <PropertyCard spaceId={s.id} player={player} />
                  </Button>
                ))}
                {myProps.length === 0 && <Text style={{ fontSize: 12, color: '#A0A0A0' }}>No properties yet</Text>}
              </View>
            </Scroller>
          </View>
        </>
      )}

      {cardModal && <CardModal card={cardModal} onClose={() => setCardModal(null)} />}
      {propModal && <PropertyModal spaceId={propModal.spaceId} onBuy={handleBuyProperty} onAuction={handleAuction} game={game} playerId={playerId} />}
      {auctionModal && <AuctionModal auction={auctionModal} game={game} playerId={playerId} socket={socket} />}
      {rentModal && <RentModal spaceId={rentModal.spaceId} rent={rentModal.rent} amount={rentModal.amount} isTax={rentModal.isTax} onPay={rentModal.isTax ? handlePayTax : handlePayRent} onBankrupt={handleBankrupt} game={game} playerId={playerId} onOpenBuildings={handleOpenBuildings} />}
      {buildModal && <BuildingsModal {...buildModal} onBuildHouse={handleBuildHouse} onBuildHotel={handleBuildHotel} onSell={handleSellHouse} onMortgage={handleMortgage} onUnmortgage={handleUnmortgage} onClose={() => setBuildModal(null)} game={game} playerId={playerId} />}
      {tradeModal && <TradeModal game={game} playerId={playerId} socket={socket} onClose={() => setTradeModal(false)} />}
      {tradeProposal && <TradeProposalModal proposal={tradeProposal} game={game} playerId={playerId} onAccept={handleAcceptTrade} onDecline={handleDeclineTrade} />}
      {propsModal && <PlayerPropsModal game={game} playerId={propsModal} onClose={() => setPropsModal(null)} onSelectProp={(pid) => setBuildModal({ spaceId: pid })} />}
        {leaveConfirm && (
          <Overlay>
            <View style={{
              background: '#1E1E1E', backdropFilter: 'blur(20px)',
              borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
              padding: 24, maxWidth: 300, width: '90%', textAlign: 'center',
            }}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>Leave game?</Text>
              <Text style={{ fontSize: 13, color: '#A0A0A0', marginBottom: 16 }}>Are you sure?</Text>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <Button onPress={handleLeaveConfirm}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#3B82F6', color: '#F0F0F0' }}>
                  Leave
                </Button>
                <Button onPress={handleLeaveCancel}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#1E1E1E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </Button>
              </View>
            </View>
          </Overlay>
        )}
    </View>
  );
}

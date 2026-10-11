const coffeeBossService = require('./coffee-boss.service');

class CoffeeSocketGateway {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomName -> Map(socketId -> playerData)
    this.socketToRoom = new Map(); // socketId -> roomName
    this.maxPlayersPerRoom = 20;

    // Connect gateway with boss manager
    const bossManager = coffeeBossService.getBossManager();
    bossManager.setGateway(this);

    this.setupListeners();
  }

  getConnectedPlayerCount() {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.size;
    }
    return count;
  }

  findAvailableRoom() {
    let roomIndex = 1;
    while (true) {
      const roomName = `Lounge-${roomIndex.toString().padStart(2, '0')}`;
      const room = this.rooms.get(roomName);
      if (!room || room.size < this.maxPlayersPerRoom) {
        if (!this.rooms.has(roomName)) {
          this.rooms.set(roomName, new Map());
        }
        return roomName;
      }
      roomIndex++;
    }
  }

  setupListeners() {
    this.io.on('connection', (socket) => {
      // 1. Join Coffee Lounge
      socket.on('coffee:join_room', async (data) => {
        try {
          const storeId = Number(data.storeId || 0);
          const storeName = data.storeName || `Barista #${storeId}`;
          const avatarId = data.avatarId || 1;
          const title = data.title || 'Barista Tập Sự';

          // Assign room
          const roomName = this.findAvailableRoom();
          socket.join(roomName);
          this.socketToRoom.set(socket.id, roomName);

          const room = this.rooms.get(roomName);

          // Random starting position in Lounge (960 x 540)
          const startX = Math.floor(250 + Math.random() * 460);
          const startY = Math.floor(300 + Math.random() * 150);

          const playerData = {
            socketId: socket.id,
            storeId,
            storeName,
            avatarId,
            title,
            x: startX,
            y: startY,
            state: 'idle',
            direction: Math.random() > 0.5 ? 1 : -1,
            sitting: false,
            lastChat: '',
            lastEmote: '',
            coffeeSteam: false,
            joinedAt: Date.now()
          };

          room.set(socket.id, playerData);

          // Fetch state
          const storeState = await coffeeBossService.getStoreCoffeeState(storeId);
          const bossManager = coffeeBossService.getBossManager();
          const bossState = bossManager.getPublicState();

          // Send room state to newly joined player
          socket.emit('coffee:room_state', {
            roomName,
            playerCount: room.size,
            maxPlayers: this.maxPlayersPerRoom,
            you: playerData,
            players: Array.from(room.values()),
            storeState,
            bossState
          });

          // Broadcast to other players in room
          socket.to(roomName).emit('coffee:player_joined', {
            player: playerData,
            roomName,
            playerCount: room.size
          });

          console.log(`[CoffeeGateway] ☕ ${storeName} (Store #${storeId}) joined ${roomName} (${room.size}/${this.maxPlayersPerRoom})`);
        } catch (err) {
          console.error('[CoffeeGateway] Join room error:', err);
          socket.emit('coffee:error', { message: err.message });
        }
      });

      // 2. Player Move
      socket.on('coffee:move', (data) => {
        const roomName = this.socketToRoom.get(socket.id);
        if (!roomName) return;

        const room = this.rooms.get(roomName);
        if (!room) return;

        const player = room.get(socket.id);
        if (!player) return;

        // Clamp coordinates within map (960 x 540)
        player.x = Math.max(50, Math.min(910, Number(data.x || player.x)));
        player.y = Math.max(220, Math.min(500, Number(data.y || player.y)));
        player.state = data.state || 'idle';
        player.direction = data.direction !== undefined ? data.direction : player.direction;
        player.sitting = !!data.sitting;

        socket.to(roomName).emit('coffee:player_moved', {
          socketId: socket.id,
          storeId: player.storeId,
          x: player.x,
          y: player.y,
          state: player.state,
          direction: player.direction,
          sitting: player.sitting
        });
      });

      // 3. Player Chat
      socket.on('coffee:chat', (data) => {
        const roomName = this.socketToRoom.get(socket.id);
        if (!roomName) return;

        const room = this.rooms.get(roomName);
        if (!room) return;

        const player = room.get(socket.id);
        if (!player) return;

        const message = String(data.message || '').trim().substring(0, 100);
        if (!message) return;

        player.lastChat = message;
        player.lastChatTime = Date.now();

        this.io.to(roomName).emit('coffee:player_chat', {
          socketId: socket.id,
          storeId: player.storeId,
          playerName: player.storeName,
          message,
          timestamp: Date.now()
        });
      });

      // 4. Player Emote (wave, cheers, dance, heart)
      socket.on('coffee:emote', (data) => {
        const roomName = this.socketToRoom.get(socket.id);
        if (!roomName) return;

        const room = this.rooms.get(roomName);
        if (!room) return;

        const player = room.get(socket.id);
        if (!player) return;

        player.lastEmote = data.emote || 'wave';
        player.lastEmoteTime = Date.now();

        this.io.to(roomName).emit('coffee:player_emoted', {
          socketId: socket.id,
          storeId: player.storeId,
          emote: player.lastEmote,
          timestamp: Date.now()
        });
      });

      // 5. Drink Coffee
      socket.on('coffee:drink', async (data) => {
        const roomName = this.socketToRoom.get(socket.id);
        if (!roomName) return;

        const room = this.rooms.get(roomName);
        if (!room) return;

        const player = room.get(socket.id);
        if (!player) return;

        try {
          const result = await coffeeBossService.drinkCoffee(player.storeId, data.coffeeId);
          player.coffeeSteam = true;

          // Notify player with buff details
          socket.emit('coffee:drink_success', result);

          // Broadcast drinking animation to peers in room
          this.io.to(roomName).emit('coffee:player_drank', {
            socketId: socket.id,
            storeId: player.storeId,
            playerName: player.storeName,
            coffeeId: data.coffeeId,
            buffName: result.buff.name,
            icon: result.buff.icon
          });
        } catch (err) {
          socket.emit('coffee:error', { message: err.message });
        }
      });

      // 6. Boss Shoot (Projectiles & Damage)
      socket.on('boss:shoot', async (data) => {
        const roomName = this.socketToRoom.get(socket.id);
        if (!roomName) return;

        const room = this.rooms.get(roomName);
        if (!room) return;

        const player = room.get(socket.id);
        if (!player) return;

        try {
          const bossManager = coffeeBossService.getBossManager();
          const pearlType = data.pearlType || 'pearl_basic';
          const targetX = Number(data.targetX || 480);
          const targetY = Number(data.targetY || 200);

          const result = await bossManager.processAttack(player.storeId, player.storeName, pearlType);

          // Broadcast projectile animation from player to Boss
          this.io.to(roomName).emit('boss:projectile', {
            socketId: socket.id,
            storeId: player.storeId,
            startX: player.x,
            startY: player.y,
            targetX,
            targetY,
            pearlType,
            damage: result.damage,
            isCrit: result.isCrit,
            isCosmic: result.isCosmic,
            isFreeze: result.isFreeze,
            isDoT: result.isDoT,
            isDeflected: result.isDeflected
          });

          // Broadcast updated HP and live Top 5 damage leaderboard
          this.io.to(roomName).emit('boss:damage_update', {
            currentHp: result.currentHp,
            maxHp: result.maxHp,
            hpPercent: result.hpPercent,
            phase: result.phase,
            leaderboard: bossManager.getTopLeaderboard(5)
          });

          // Emit remaining ammo to shooter
          socket.emit('boss:shoot_feedback', {
            remainingAmmo: result.remainingAmmo,
            ammoInventory: result.ammoInventory,
            pearlType
          });
        } catch (err) {
          socket.emit('coffee:error', { message: err.message });
        }
      });

      // 7. Eat Food Buff
      socket.on('boss:eat_food', async (data) => {
        const roomName = this.socketToRoom.get(socket.id);
        if (!roomName) return;

        const room = this.rooms.get(roomName);
        if (!room) return;

        const player = room.get(socket.id);
        if (!player) return;

        try {
          const result = await coffeeBossService.buyFoodBuff(player.storeId, data.foodId);
          socket.emit('boss:food_success', result);
        } catch (err) {
          socket.emit('coffee:error', { message: err.message });
        }
      });

      // 7.5 Bé Trà Ammo Supply
      socket.on('boss:be_tra_supply', async () => {
        const roomName = this.socketToRoom.get(socket.id);
        if (!roomName) return;

        const room = this.rooms.get(roomName);
        if (!room) return;

        const player = room.get(socket.id);
        if (!player) return;

        try {
          const result = await coffeeBossService.claimBeTraSupply(player.storeId);
          socket.emit('boss:shoot_feedback', { ammoInventory: result.pearlInventory });
        } catch (err) {
          socket.emit('coffee:error', { message: err.message });
        }
      });

      // 8. Admin / Test Trigger Boss
      socket.on('boss:admin_trigger', async (data) => {
        try {
          const bossManager = coffeeBossService.getBossManager();
          const duration = Number(data.durationSec || 900);
          await bossManager.startBossEvent(duration);
        } catch (err) {
          socket.emit('coffee:error', { message: err.message });
        }
      });

      // 9. Disconnect
      socket.on('disconnect', () => {
        const roomName = this.socketToRoom.get(socket.id);
        if (roomName) {
          this.socketToRoom.delete(socket.id);
          const room = this.rooms.get(roomName);
          if (room) {
            const player = room.get(socket.id);
            room.delete(socket.id);
            if (player) {
              socket.to(roomName).emit('coffee:player_left', {
                socketId: socket.id,
                storeId: player.storeId,
                playerName: player.storeName,
                playerCount: room.size
              });
              console.log(`[CoffeeGateway] 🚪 ${player.storeName} left ${roomName} (${room.size}/${this.maxPlayersPerRoom})`);
            }
            if (room.size === 0) {
              this.rooms.delete(roomName);
            }
          }
        }
      });
    });
  }

  // --- Broadcasts from BossEventManager ---

  broadcastCountdown(remainingSec) {
    this.io.emit('boss:countdown', {
      remainingSec,
      message: `⏰ Báo động: Quái vật Hưng Răm sẽ xuất hiện sau ${Math.ceil(remainingSec / 60)} phút!`
    });
  }

  broadcastBossSpawn(bossState) {
    this.io.emit('boss:spawn', {
      bossState,
      message: '🚨 BÁO ĐỘNG SIREN! Quái vật Hưng Răm (#52) đã trồi lên từ bệ triệu hồi giữa Lounge!'
    });
  }

  broadcastBossEnded(data) {
    this.io.emit('boss:victory_or_timeout', data);
  }
}

let gatewayInstance = null;

function initCoffeeSocketGateway(io) {
  if (!gatewayInstance) {
    gatewayInstance = new CoffeeSocketGateway(io);
  }
  return gatewayInstance;
}

module.exports = {
  initCoffeeSocketGateway,
  getCoffeeSocketGateway: () => gatewayInstance
};


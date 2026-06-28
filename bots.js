const mineflayer = require('mineflayer');

const SERVER_HOST = 'CoolServer.aternos.me';
const SERVER_PORT = 25565;

function createBot(name, reconnectInterval) {
  let bot;
  let movementInterval;
  let reconnectTimer;
  let afkInterval;
  let lookInterval;

  function cleanup() {
    if (movementInterval) clearInterval(movementInterval);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (afkInterval) clearInterval(afkInterval);
    if (lookInterval) clearInterval(lookInterval);
    movementInterval = null;
    reconnectTimer = null;
    afkInterval = null;
    lookInterval = null;
  }

  function connect() {
    cleanup();

    bot = mineflayer.createBot({
      host: SERVER_HOST,
      port: SERVER_PORT,
      username: name,
      version: '1.20.1',
      hideErrors: true,
      checkTimeoutInterval: 30000
    });

    bot.once('spawn', () => {
      startRandomMovement();
      if (name === 'John') startAntiAFK();

      reconnectTimer = setTimeout(() => {
        cleanup();
        try { bot.quit(); } catch(e) {}
        setTimeout(connect, 5000);
      }, reconnectInterval);
    });

    bot.on('death', () => {
      try { bot.respawn(); } catch(e) {}
    });

    bot.on('health', () => {
      try { if (bot.health <= 0) bot.respawn(); } catch(e) {}
    });

    bot.on('error', () => {
      cleanup();
      setTimeout(connect, 10000);
    });

    bot.on('kicked', () => {
      cleanup();
      setTimeout(connect, 10000);
    });

    bot.on('end', () => {
      cleanup();
    });
  }

  function startRandomMovement() {
    const controls = ['forward', 'back', 'left', 'right'];

    movementInterval = setInterval(() => {
      if (!bot || !bot.entity) return;

      controls.forEach(c => bot.setControlState(c, false));
      const randomDir = controls[Math.floor(Math.random() * controls.length)];
      bot.setControlState(randomDir, true);

      if (Math.random() < 0.3) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          try { bot.setControlState('jump', false); } catch(e) {}
        }, 500);
      }

    }, 2000);
  }

  function startAntiAFK() {
    // Swing arm silently
    afkInterval = setInterval(() => {
      try { bot.swingArm(); } catch(e) {}
    }, 60000);

    // Look around silently instead of chatting
    lookInterval = setInterval(() => {
      try {
        bot.look(Math.random() * Math.PI * 2, 0, true);
      } catch(e) {}
    }, 600000);

    // Sneak every 2 minutes
    setInterval(() => {
      try {
        bot.setControlState('sneak', true);
        setTimeout(() => {
          try { bot.setControlState('sneak', false); } catch(e) {}
        }, 2000);
      } catch(e) {}
    }, 120000);
  }

  connect();
}

createBot('John', 10 * 60 * 1000);
setTimeout(() => createBot('Egypt', 5 * 60 * 1000), 5000);

const mineflayer = require('mineflayer');
const http = require('http');

// 1. Silent Web Server to keep Railway happy and prevent deployment failure
http.createServer((req, res) => {
  res.writeHead(200);
  res.end();
}).listen(process.env.PORT || 3000);

// Default Minecraft Java Port
const DEFAULT_PORT = 25565;

function createBot(name, host, reconnectInterval) {
  let bot;
  let movementInterval;
  let reconnectTimer;
  let afkInterval;
  let lookInterval;
  let sneakInterval;

  function cleanup() {
    if (movementInterval) clearInterval(movementInterval);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (afkInterval) clearInterval(afkInterval);
    if (lookInterval) clearInterval(lookInterval);
    if (sneakInterval) clearInterval(sneakInterval);
    movementInterval = null;
    reconnectTimer = null;
    afkInterval = null;
    lookInterval = null;
    sneakInterval = null;
  }

  function connect() {
    cleanup();

    bot = mineflayer.createBot({
      host: host,
      port: DEFAULT_PORT,
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
    afkInterval = setInterval(() => {
      try { bot.swingArm(); } catch(e) {}
    }, 60000);

    lookInterval = setInterval(() => {
      try {
        bot.look(Math.random() * Math.PI * 2, 0, true);
      } catch(e) {}
    }, 600000);

    sneakInterval = setInterval(() => {
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

const ONE_HOUR = 60 * 60 * 1000;

// Join CoolServerEG.aternos.me
createBot('John', 'CoolServerEG.aternos.me', ONE_HOUR);
setTimeout(() => createBot('Egypt', 'CoolServerEG.aternos.me', ONE_HOUR), 5000);

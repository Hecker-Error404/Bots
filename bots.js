const mineflayer = require('mineflayer');

const config = {
    host: 'nigerfromnigeria.aternos.me', // Change to your server IP
    port: 16304,       // Change to your server port
    version: '1.21.10'     // e.g., '1.20.1'
};

function createBot(username, dcIntervalMin, chatIntervalMinMax) {
    let bot = null;
    let chatTimer = null;
    let moveTimer = null;
    let moveTimeout = null;
    let reconnectTimeout = null;
    let cycleInterval = null;

    function cleanup() {
        // Clear all active timers to prevent memory leaks
        if (chatTimer) clearTimeout(chatTimer);
        if (moveTimer) clearInterval(moveTimer);
        if (moveTimeout) clearTimeout(moveTimeout);
        if (reconnectTimeout) clearTimeout(reconnectTimeout);

        if (bot) {
            // Remove all event listeners so old bot objects can be garbage collected
            bot.removeAllListeners();
            try {
                bot.quit();
            } catch (e) {
                // Silent catch
            }
            bot = null;
        }
    }

    function initBot() {
        cleanup(); // Ensure total isolation from previous instances

        bot = mineflayer.createBot({
            host: config.host,
            port: config.port,
            username: username,
            version: config.version
        });

        bot.on('spawn', () => {
            startMoving();
            startChatting();
        });

        bot.on('death', () => {
            if (bot) bot.respawn();
        });

        bot.on('end', () => {
            cleanup();
            // Reconnect silently after 5 seconds
            reconnectTimeout = setTimeout(initBot, 5000);
        });

        bot.on('error', () => {
            // Silently swallow errors to avoid console noise or crashes
        });
    }

    // Movement Logic
    function startMoving() {
        moveTimer = setInterval(() => {
            if (!bot || !bot.entity) return;
            const directions = ['forward', 'back', 'left', 'right'];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            
            bot.setControlState(randomDir, true);
            
            moveTimeout = setTimeout(() => {
                if (bot && bot.entity) bot.setControlState(randomDir, false);
            }, 1000);
        }, Math.random() * 3000 + 2000);
    }

    // Chat Logic
    function startChatting() {
        const scheduleNextChat = () => {
            const minMs = chatIntervalMinMax.min * 60 * 1000;
            const maxMs = chatIntervalMinMax.max * 60 * 1000;
            const randomDelay = Math.random() * (maxMs - minMs) + minMs;

            chatTimer = setTimeout(() => {
                if (bot && bot.entity) {
                    const msgs = ['hi', 'goodbye'];
                    bot.chat(msgs[Math.floor(Math.random() * msgs.length)]);
                }
                scheduleNextChat();
            }, randomDelay);
        };
        scheduleNextChat();
    }

    // Disconnect Cycle Logic
    cycleInterval = setInterval(() => {
        initBot(); // Re-initializing handles cleanup and recreates the connection safely
    }, dcIntervalMin * 60 * 1000);

    initBot();
}

// Start both bots silently with your rules
createBot('j', 20, { min: 10, max: 20 });
createBot('jf', 30, { min: 10, max: 20 });

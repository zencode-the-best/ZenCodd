const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.login(process.env.BOT_TOKEN);

client.once("ready", () => {
    console.log(`🤖 Zalogowano jako ${client.user.tag}`);
});

module.exports = client;

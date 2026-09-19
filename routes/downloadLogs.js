const { EmbedBuilder } = require("discord.js");
const client = require("../discord-client");

async function sendDownloadLog(user, category, fileName) {

    try {

        const channel = await client.channels.fetch(
            process.env.DOWNLOAD_LOG_CHANNEL_ID
        );

        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("📥 Nowe pobranie")
            .addFields(
                {
                    name: "👤 Użytkownik",
                    value: user
                        ? `<@${user.id}> (${user.username})`
                        : "Niezalogowany",
                    inline: false
                },
                {
                    name: "📂 Kategoria",
                    value: category,
                    inline: true
                },
                {
                    name: "📦 Nazwa",
                    value: fileName,
                    inline: true
                }
            )
            .setTimestamp();

        await channel.send({
            embeds: [embed]
        });

    } catch (err) {

        console.error("Błąd logów pobrań:", err);

    }

}

module.exports = {
    sendDownloadLog
};

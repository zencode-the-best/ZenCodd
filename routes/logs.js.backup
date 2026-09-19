const express = require("express");
const { EmbedBuilder } = require("discord.js");
const client = require("../discord-client");

const router = express.Router();

router.post("/create", async (req, res) => {

    try {

        const channel = await client.channels.fetch(
            process.env.LOG_CHANNEL_ID
        );

        if (!channel) {

            return res.status(404).json({
                success: false,
                message: "Nie znaleziono kanału logów."
            });

        }

        const creator = req.body.creator || "Nieznany";

        const username = req.user
            ? `<@${req.user.id}>`
            : "Niezalogowany";

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("🚀 Nowe utworzenie")
            .addFields(
                {
                    name: "👤 Użytkownik",
                    value: username,
                    inline: false
                },
                {
                    name: "🛠️ Kreator",
                    value: creator,
                    inline: false
                }
            )
            .setTimestamp();

        if (process.env.BANNER_IMAGE) {
            embed.setImage(process.env.BANNER_IMAGE);
        }

        await channel.send({
            embeds: [embed]
        });

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Błąd podczas wysyłania logu."
        });

    }

});

module.exports = router;

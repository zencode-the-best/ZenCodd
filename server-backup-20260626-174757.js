require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

require("./oauth");

const app = express();

const bot = new Client({
    intents: [GatewayIntentBits.Guilds]
});

bot.login(process.env.BOT_TOKEN);

bot.once("ready", () => {
    console.log(`🤖 ${bot.user.tag}`);
});

app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.get(
    "/auth/discord",
    passport.authenticate("discord")
);

app.get(
    "/auth/discord/callback",
    passport.authenticate("discord", {
        failureRedirect: "/"
    }),
    (req, res) => {
        req.session.save(() => {
            res.redirect("/");
        });
    }
);

app.get("/api/user", (req, res) => {

    if (!req.user) {
        return res.json({
            logged: false
        });
    }

    const avatar = req.user.avatar
        ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
        : "https://cdn.discordapp.com/embed/avatars/0.png";

    res.json({
        logged: true,
        id: req.user.id,
        username: req.user.username,
        avatar,
        premium: req.user.premium || false,
        subscriber: req.user.subscriber || false
    });

});

/* LOGI */

app.post("/api/log-create", async (req, res) => {

    try {

        const channel =
            await bot.channels.fetch(
                process.env.LOG_CHANNEL_ID
            );

        const creator =
            req.body.creator || "Nieznany";

        const username =
            req.user
                ? `<@${req.user.id}>`
                : "[INCOGNITO] - niezalogowany";

        const date =
            new Date().toLocaleString("pl-PL");

        const embed =
            new EmbedBuilder()
            .setColor(0x3b82f6)
            .setDescription(
`<:09:1243544837622599752> Użytkownik: ${username}

<:07:1243544833482555452> Stworzył: \`${creator}\`

<a:clock:1249452752816439378> Dnia: **${date}**`
            )
            .setImage(
                process.env.BANNER_IMAGE
            );

        await channel.send({
            embeds: [embed]
        });

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});

app.get("/logout", (req, res) => {

    req.logout(() => {

        req.session.destroy(() => {

            res.redirect("/");

        });

    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`
=================================
🚀 ZenCode Studio
🌐 http://localhost:${PORT}
🌍 ${process.env.BASE_URL}
👤 CLIENT_ID: ${process.env.CLIENT_ID}
🏰 GUILD_ID: ${process.env.GUILD_ID}
✅ OAuth Discord aktywny
=================================
`);

});

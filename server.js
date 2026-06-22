require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

require("./oauth");

const app = express();

app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET || "zencode_secret",
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
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/auth/discord",
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
        : `https://cdn.discordapp.com/embed/avatars/0.png`;

    res.json({
        logged: true,
        id: req.user.id,
        username: req.user.username,
        avatar
    });
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
✅ OAuth Discord aktywny
=================================
`);
});

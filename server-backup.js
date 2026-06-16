require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/user", (req, res) => {
    if (!req.session.user) {
        return res.json({
            logged: false
        });
    }

    res.json({
        logged: true,
        user: req.session.user
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
=================================
🚀 ZenCode Studio
🌐 http://localhost:${PORT}
🌍 ${process.env.BASE_URL || "Brak BASE_URL"}
✅ Serwer uruchomiony
=================================
`);
});

require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

require("./oauth");
require("./discord-client");

const authRoutes = require("./routes/auth");
const pluginRoutes = require("./routes/plugins");
const adminRoutes = require("./routes/admin");
const logRoutes = require("./routes/logs");
const settingsRoutes = require("./routes/settings");
const productsRoutes = require("./routes/products");

const app = express();

app.set("trust proxy", 1);

/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

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

/* =========================================
   PLIKI PUBLICZNE
========================================= */

app.use(express.static(
    path.join(__dirname, "public")
));

/* =========================================
   STRONA GŁÓWNA
========================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

/* =========================================
   PLUGINY
========================================= */

app.get("/plugins", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "plugins",
            "index.html"
        )
    );

});

/* =========================================
   GRAFIKA CREATOR
========================================= */

app.get("/creator", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "creator",
            "index.html"
        )
    );

});

/* =========================================
   SKRYPTY
========================================= */

app.get("/scripts", (req, res) => {

    const scriptsPage = path.join(
        __dirname,
        "public",
        "scripts",
        "index.html"
    );

    res.sendFile(
        scriptsPage,
        (err) => {

            if (err) {

                console.error(
                    "Nie znaleziono strony /scripts:",
                    err.message
                );

                res.status(404).send(
                    "Strona Skrypty nie jest jeszcze dostępna."
                );

            }

        }
    );

});

/* =========================================
   DASHBOARD
========================================= */

app.get("/dashboard", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "dashboard",
            "index.html"
        )
    );

});

/* =========================================
   ZENITYHOST
========================================= */

app.get("/hosting", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "hosting",
            "index.html"
        )
    );

});

/* =========================================
   PANEL ADMINISTRATORA
========================================= */

app.get("/admin", (req, res) => {

    if (!req.user) {

        return res.redirect("/");

    }

    if (
        req.user.id !== "1238570679465410571"
    ) {

        return res.redirect("/dashboard");

    }

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "admin",
            "index.html"
        )
    );

});

/* =========================================
   AUTORYZACJA
========================================= */

app.use(
    "/auth",
    authRoutes
);

/* =========================================
   API PLUGINÓW
========================================= */

app.use(
    "/api/plugins",
    pluginRoutes
);

/* =========================================
   API PRODUKTÓW
========================================= */

app.use(
    "/api/products",
    productsRoutes
);

/* =========================================
   API ADMINISTRATORA
========================================= */

app.use(
    "/api/admin",
    adminRoutes
);

/* =========================================
   API LOGÓW
========================================= */

app.use(
    "/api/logs",
    logRoutes
);

/* =========================================
   API USTAWIEŃ
========================================= */

app.use(
    "/api/settings",
    settingsRoutes
);

/* =========================================
   API UŻYTKOWNIKA
========================================= */

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

/* =========================================
   WYLOGOWANIE
========================================= */

app.get("/logout", (req, res) => {

    req.logout(() => {

        req.session.destroy(() => {

            res.redirect("/");

        });

    });

});

/* =========================================
   404
========================================= */

app.use((req, res) => {

    res.status(404).sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

/* =========================================
   OBSŁUGA BŁĘDÓW
========================================= */

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({

        success: false,

        message: "Wystąpił błąd serwera."

    });

});

/* =========================================
   START
========================================= */

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`

========================================
🚀 ZenityCode Studio uruchomione
🌐 http://localhost:${PORT}
🌍 ${process.env.BASE_URL}
🤖 Discord Client: ${process.env.CLIENT_ID}
🏰 Guild: ${process.env.GUILD_ID}
========================================

`);

});

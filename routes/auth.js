const express = require("express");
const passport = require("passport");

const router = express.Router();

router.get(
    "/discord",
    passport.authenticate("discord")
);

router.get(
    "/discord/callback",
    passport.authenticate("discord", {
        failureRedirect: "/"
    }),
    (req, res) => {

        req.session.save((err) => {

            if (err) {
                console.error("SESSION SAVE ERROR:", err);
                return res.redirect("/");
            }

            res.redirect("/dashboard");

        });

    }
);

router.get("/logout", (req, res) => {

    req.logout((err) => {

        if (err) {
            console.error("LOGOUT ERROR:", err);
        }

        req.session.destroy((sessionErr) => {

            if (sessionErr) {
                console.error(
                    "SESSION DESTROY ERROR:",
                    sessionErr
                );
            }

            res.redirect("/");

        });

    });

});

router.get("/user", (req, res) => {

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

module.exports = router;

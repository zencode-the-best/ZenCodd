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

        req.session.save(() => {

            res.redirect("/");

        });

    }
);

router.get("/logout", (req, res) => {

    req.logout(() => {

        req.session.destroy(() => {

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

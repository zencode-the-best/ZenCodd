const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {

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

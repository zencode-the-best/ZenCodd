const express = require("express");
const passport = require("passport");

const {
    saveUser
} = require("./hosting-users");

const router =
    express.Router();


router.get(
    "/discord",
    passport.authenticate(
        "discord"
    )
);


router.get(
    "/discord/callback",
    passport.authenticate(
        "discord",
        {
            failureRedirect: "/"
        }
    ),

    (req, res) => {

        try {

            saveUser(
                req.user
            );

        } catch (error) {

            console.error(
                "Błąd zapisu użytkownika:",
                error
            );

        }

        res.redirect(
            "/dashboard"
        );

    }
);


module.exports = router;

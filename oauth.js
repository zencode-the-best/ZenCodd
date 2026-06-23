const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const axios = require("axios");

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(
    new DiscordStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: `${process.env.BASE_URL}/auth/discord/callback`,
            scope: ["identify"]
        },
        async (accessToken, refreshToken, profile, done) => {

            profile.premium = false;
            profile.subscriber = false;

            try {

                const response = await axios.get(
                    `https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${profile.id}`,
                    {
                        headers: {
                            Authorization: `Bot ${process.env.BOT_TOKEN}`
                        }
                    }
                );

                const roles = response.data.roles || [];

                console.log("USER:", profile.username);
                console.log("ROLES:", roles);

                profile.premium = roles.includes(
                    process.env.PREMIUM_ROLE_ID
                );

                profile.subscriber = roles.includes(
                    process.env.SUB_ROLE_ID
                );

                console.log("PREMIUM:", profile.premium);
                console.log("SUBSCRIBER:", profile.subscriber);

            } catch (error) {

                console.log("ROLE ERROR:");
                console.log(
                    error?.response?.data ||
                    error?.message ||
                    error
                );

            }

            return done(null, profile);
        }
    )
);

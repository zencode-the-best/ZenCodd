const passport = require("passport");
const DiscordStrategy =
    require("passport-discord");

passport.use(
    new DiscordStrategy(
        {
            clientID:
                process.env.CLIENT_ID,

            clientSecret:
                process.env.CLIENT_SECRET,

            callbackURL:
                `${process.env.BASE_URL}/auth/discord/callback`,

            scope: [
                "identify",
                "email",
                "guilds"
            ]
        },

        async (
            accessToken,
            refreshToken,
            profile,
            done
        ) => {

            try {

                profile.email =
                    profile.email || null;

                done(
                    null,
                    profile
                );

            } catch (error) {

                done(
                    error,
                    null
                );

            }

        }
    )
);


passport.serializeUser(
    (user, done) => {

        done(
            null,
            user
        );

    }
);


passport.deserializeUser(
    (user, done) => {

        done(
            null,
            user
        );

    }
);

const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new DiscordStrategy(
{
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/discord/callback`,
    scope: ["identify", "guilds"]
},
(accessToken, refreshToken, profile, done) => {
    process.nextTick(() => {
        return done(null, profile);
    });
}));

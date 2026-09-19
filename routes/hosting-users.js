const fs = require("fs");
const path = require("path");

const USERS =
    path.join(
        __dirname,
        "..",
        "data",
        "hosting",
        "users.json"
    );

function saveUser(profile) {

    const dir =
        path.dirname(USERS);

    fs.mkdirSync(
        dir,
        {
            recursive: true
        }
    );

    let users = [];

    if (fs.existsSync(USERS)) {

        try {

            users =
                JSON.parse(
                    fs.readFileSync(
                        USERS,
                        "utf8"
                    )
                );

        } catch {

            users = [];

        }

    }

    const existing =
        users.find(
            user =>
                user.id === profile.id
        );

    const user = {

        id:
            profile.id,

        username:
            profile.username,

        globalName:
            profile.global_name ||
            profile.globalName ||
            profile.username,

        email:
            profile.email ||
            null,

        avatar:
            profile.avatar ||
            null,

        updatedAt:
            new Date().toISOString()

    };

    if (existing) {

        Object.assign(
            existing,
            user
        );

    } else {

        users.push(user);

    }

    fs.writeFileSync(
        USERS,
        JSON.stringify(
            users,
            null,
            4
        )
    );

    return user;
}

module.exports = {
    saveUser
};

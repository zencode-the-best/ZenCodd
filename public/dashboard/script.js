const OWNER_ID = "1238570679465410571";


/* =========================================
   USER
========================================= */

async function loadUser() {

    try {

        const res =
            await fetch("/api/user");

        const user =
            await res.json();

        if (!user.logged) {

            location.href = "/";

            return;

        }


        const userBox =
            document.getElementById("userBox");

        if (userBox) {

            userBox.innerHTML = `
                <img
                    src="${user.avatar}"
                    alt=""
                    style="
                        width:42px;
                        height:42px;
                        border-radius:50%;
                        object-fit:cover;
                        vertical-align:middle;
                        margin-right:10px;
                    "
                >

                <span>
                    ${user.username}
                </span>
            `;

        }


        const username =
            document.getElementById("username");

        if (username) {

            username.textContent =
                user.username;

        }


        const rank =
            document.getElementById("rank");

        if (rank) {

            let userRank =
                "👤 Użytkownik";


            if (user.id === OWNER_ID) {

                userRank =
                    "👑 CEO";

            } else if (user.premium) {

                userRank =
                    "⭐ Premium";

            } else if (user.subscriber) {

                userRank =
                    "💎 Subskrybent";

            }


            rank.textContent =
                userRank;

        }

    } catch (error) {

        console.error(
            "Błąd ładowania użytkownika:",
            error
        );

    }

}


/* =========================================
   FEATURES
========================================= */

async function loadFeatures() {

    try {

        const res =
            await fetch("/api/config/all");

        const config =
            await res.json();


        if (!config.creators) {

            const creatorCard =
                [...document.querySelectorAll(".card")]
                    .find(card =>
                        card.textContent.includes(
                            "Kreatorzy"
                        )
                    );

            if (creatorCard) {

                creatorCard.style.display =
                    "none";

            }


            const creatorsSection =
                document.getElementById(
                    "creatorsSection"
                );

            if (creatorsSection) {

                creatorsSection.style.display =
                    "none";

            }

        }


        if (!config.plugins) {

            const pluginsCard =
                [...document.querySelectorAll(".card")]
                    .find(card =>
                        card.textContent.includes(
                            "Marketplace"
                        )
                    );

            if (pluginsCard) {

                pluginsCard.style.display =
                    "none";

            }

        }


        if (!config.scripts) {

            const scriptsCard =
                [...document.querySelectorAll(".card")]
                    .find(card =>
                        card.textContent.includes(
                            "Skrypty"
                        )
                    );

            if (scriptsCard) {

                scriptsCard.style.display =
                    "none";

            }

        }


        if (!config.premium) {

            const premiumButton =
                document.getElementById(
                    "premiumButton"
                );

            if (premiumButton) {

                const premiumCard =
                    premiumButton.closest(
                        ".card"
                    );

                if (premiumCard) {

                    premiumCard.style.display =
                        "none";

                }

            }

        }

    } catch (error) {

        console.error(
            "Błąd konfiguracji:",
            error
        );

    }

}


/* =========================================
   BUTTONS
========================================= */

function setupButtons() {


    /* PREMIUM */

    const premiumButton =
        document.getElementById(
            "premiumButton"
        );

    if (premiumButton) {

        premiumButton.addEventListener(
            "click",
            () => {

                window.open(
                    "https://discord.gg/zenitycode",
                    "_blank"
                );

            }
        );

    }


    /* SETTINGS */

    const settingsButton =
        document.getElementById(
            "settingsButton"
        );

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            async () => {

                try {

                    const res =
                        await fetch(
                            "/api/user"
                        );

                    const user =
                        await res.json();


                    if (!user.logged) {

                        location.href =
                            "/";

                        return;

                    }


                    if (user.id === OWNER_ID) {

                        location.href =
                            "/admin";

                    } else {

                        alert(
                            "Panel ustawień będzie dostępny wkrótce."
                        );

                    }

                } catch (error) {

                    console.error(error);

                }

            }
        );

    }

}


/* =========================================
   START
========================================= */

async function startDashboard() {

    await loadUser();

    await loadFeatures();

    setupButtons();

}


window.addEventListener(
    "DOMContentLoaded",
    () => {

        startDashboard();

    }
);

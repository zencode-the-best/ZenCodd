const OWNER_ID = "1238570679465410571";

async function loadSidebar() {
    try {
        const res = await fetch("/api/user");
        const user = await res.json();

        const avatar = document.getElementById("sidebarAvatar");
        const username = document.getElementById("sidebarUsername");
        const roleElement = document.getElementById("sidebarRole");

        if (!user.logged) {
            if (avatar) {
                avatar.src =
                    "https://cdn.discordapp.com/embed/avatars/0.png";
            }

            if (username) {
                username.textContent = "Niezalogowany";
            }

            if (roleElement) {
                roleElement.textContent = "Zaloguj się przez Discord";
            }

            return user;
        }

        if (avatar) {
            avatar.src = user.avatar;
        }

        if (username) {
            username.textContent = user.username;
        }

        let role = "Użytkownik";

        if (user.id === OWNER_ID) {
            role = "CEO";
        } else if (user.premium) {
            role = "Premium";
        } else if (user.subscriber) {
            role = "Subskrybent";
        }

        if (roleElement) {
            roleElement.textContent = role;
        }

        return user;

    } catch (err) {
        console.error("Sidebar:", err);
        return null;
    }
}


function updateSidebar(user) {

    if (!user) {
        return;
    }

    const ceoMenu =
        document.getElementById("ceoMenu");

    const premiumMenu =
        document.getElementById("premiumMenu");

    const subscriberMenu =
        document.getElementById("subscriberMenu");


    if (user.id !== OWNER_ID) {

        if (ceoMenu) {
            ceoMenu.style.display = "none";
        }

    }


    if (!user.premium && premiumMenu) {
        premiumMenu.style.opacity = "0.6";
    }


    if (!user.subscriber && subscriberMenu) {
        subscriberMenu.style.opacity = "0.6";
    }

}


function setupSidebar(user) {

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {

        if (!user || !user.logged) {

            logoutButton.textContent =
                "Zaloguj przez Discord";

            logoutButton.addEventListener("click", () => {
                location.href = "/auth/discord";
            });

        } else {

            logoutButton.addEventListener("click", () => {
                location.href = "/logout";
            });

        }

    }


    const premiumMenu =
        document.getElementById("premiumMenu");

    if (premiumMenu) {

        premiumMenu.addEventListener("click", (e) => {

            e.preventDefault();

            if (!user || !user.logged) {
                location.href = "/auth/discord";
                return;
            }

            location.href = "/premium";

        });

    }


    const subscriberMenu =
        document.getElementById("subscriberMenu");

    if (subscriberMenu) {

        subscriberMenu.addEventListener("click", (e) => {

            e.preventDefault();

            if (!user || !user.logged) {
                location.href = "/auth/discord";
                return;
            }

            location.href = "/subscriber";

        });

    }

}


window.addEventListener("DOMContentLoaded", async () => {

    const user = await loadSidebar();

    updateSidebar(user);

    setupSidebar(user);

});

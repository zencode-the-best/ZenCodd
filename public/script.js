let currentUser = null;

const OWNER_ID = "1238570679465410571";

/* =====================================================
POPUP
===================================================== */

function showPopup(title, message) {

const popup = document.createElement("div");

popup.innerHTML = `
    <div class="zc-overlay">

        <div class="zc-modal">

            <h2>${title}</h2>

            <p>${message}</p>

            <button
                type="button"
                id="closePopup"
            >
                Zamknij
            </button>

        </div>

    </div>
`;

document.body.appendChild(popup);

const closeButton =
    popup.querySelector("#closePopup");

if (closeButton) {

    closeButton.onclick = () => {
        popup.remove();
    };

}

}

/* =====================================================
USER PROFILE
===================================================== */

function renderUser(user) {

const loginBtn =
    document.querySelector(".login-btn");

if (!loginBtn) return;


if (!user.logged) {

    loginBtn.innerHTML =
        "Zaloguj przez Discord";

    loginBtn.onclick = () => {

        location.href =
            "/auth/discord";

    };

    return;

}


let status = "";


if (user.id === OWNER_ID) {

    status = "CEO";

} else if (user.premium) {

    status = "PREMIUM";

} else if (user.subscriber) {

    status = "SUBSKRYBENT";

}


loginBtn.innerHTML = `

    <span class="user-profile">

        <img
            class="user-avatar"
            src="${user.avatar}"
            alt=""
        >

        <span class="user-info">

            <span class="user-name">
                ${user.username}
            </span>

            ${
                status
                    ? `
                        <span class="user-status">
                            ${status}
                        </span>
                    `
                    : ""
            }

        </span>

    </span>

`;


loginBtn.onclick = () => {

    location.href = "/logout";

};

}

/* =====================================================
LOAD USER
===================================================== */

async function loadUser() {

try {

    const response =
        await fetch("/api/user", {
            credentials: "same-origin"
        });

    if (!response.ok) {

        throw new Error(
            "Nie udało się pobrać użytkownika."
        );

    }

    const data =
        await response.json();

    currentUser = data;

    renderUser(data);

    return data;

} catch (error) {

    console.error(
        "USER LOAD ERROR:",
        error
    );

    currentUser = {
        logged: false
    };

    renderUser(currentUser);

    return currentUser;

}

}

/* =====================================================
CREATOR ACCESS
===================================================== */

function setupCreators() {

document
    .querySelectorAll(".creator")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const role =
                    card.dataset.role;


                if (!role) {

                    location.href =
                        "/creator";

                    return;

                }


                if (!currentUser?.logged) {

                    showPopup(
                        "Logowanie wymagane",
                        "Najpierw zaloguj się przez Discord."
                    );

                    return;

                }


                if (
                    role === "premium" &&
                    !currentUser.premium
                ) {

                    showPopup(
                        "Brak dostępu",
                        "Ta funkcja wymaga rangi Premium."
                    );

                    return;

                }


                if (
                    role === "subscriber" &&
                    !currentUser.subscriber
                ) {

                    showPopup(
                        "Brak dostępu",
                        "Ta funkcja wymaga dostępu Subskrybenta."
                    );

                    return;

                }


                showPopup(
                    "Wkrótce",
                    "Ten kreator jest jeszcze w budowie."
                );

            }
        );

    });

}

/* =====================================================
ACCESS TABS
===================================================== */

function setupAccess(user) {

const ceoTab =
    document.getElementById("ceoTab");

const scriptsTab =
    document.getElementById("scriptsTab");

const pluginsTab =
    document.getElementById("pluginsTab");


/*
 * Domyślnie ukrywamy sekcje
 * wymagające dodatkowych uprawnień.
 */

if (ceoTab) {

    ceoTab.style.display =
        "none";

}

if (scriptsTab) {

    scriptsTab.style.display =
        "none";

}

if (pluginsTab) {

    pluginsTab.style.display =
        "none";

}


if (!user?.logged) {

    return;

}


/*
 * CEO
 */

if (user.id === OWNER_ID) {

    if (ceoTab) {

        ceoTab.style.display =
            "";

    }

    /*
     * CEO ma dostęp również do
     * materiałów Subskrybenta.
     */

    if (scriptsTab) {

        scriptsTab.style.display =
            "";

    }

    if (pluginsTab) {

        pluginsTab.style.display =
            "";

    }

    return;

}


/*
 * SUBSKRYBENT
 */

if (user.subscriber) {

    if (scriptsTab) {

        scriptsTab.style.display =
            "";

    }

    if (pluginsTab) {

        pluginsTab.style.display =
            "";

    }

}

}

/* =====================================================
TABS
===================================================== */

function setupTabs() {

const tabs =
    document.querySelectorAll(".tab");

const pages =
    document.querySelectorAll(".tab-page");


if (!tabs.length) {

    return;

}


tabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            const target =
                tab.dataset.tab ||
                tab.id.replace(
                    "Tab",
                    ""
                ).toLowerCase();


            if (!target) {

                return;

            }


            const page =
                document.getElementById(
                    target
                );


            if (!page) {

                return;

            }


            /*
             * Usuwamy aktywny stan.
             */

            tabs.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            pages.forEach(item => {

                item.classList.remove(
                    "active"
                );

                item.style.display =
                    "none";

            });


            /*
             * Aktywna zakładka.
             */

            tab.classList.add(
                "active"
            );


            page.classList.add(
                "active"
            );

            page.style.display =
                "block";


            /*
             * Przewijanie do zawartości
             * na urządzeniach mobilnych.
             */

            if (
                window.innerWidth <= 680
            ) {

                page.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });

            }

        }
    );

});

}

/* =====================================================
INITIALIZATION
===================================================== */

async function initialize() {

const user =
    await loadUser();

setupAccess(user);

setupTabs();

setupCreators();

}

/* =====================================================
START
===================================================== */

if (
document.readyState === "loading"
) {

document.addEventListener(
    "DOMContentLoaded",
    initialize
);

} else {

initialize();

}

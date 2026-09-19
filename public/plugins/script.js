const OWNER_ID = "1238570679465410571";

let currentUser = null;

async function loadUser() {

    try {

        const res = await fetch("/api/user");
        const user = await res.json();

        if (!user.logged) {

            location.href = "/";
            return;

        }

        currentUser = user;

        const userBox = document.getElementById("userBox");

        if (userBox) {

            userBox.innerHTML = `
                <img src="${user.avatar}" alt="Avatar">
                <span>${user.username}</span>
            `;

        }

    } catch (err) {

        console.error(err);

    }

}
function setupSearch() {

    const search = document.getElementById("search");

    if (!search) return;

    search.addEventListener("input", () => {

        const value = search.value.toLowerCase().trim();

        document.querySelectorAll(".product").forEach(product => {

            const text = product.textContent.toLowerCase();

            if (text.includes(value)) {

                product.style.display = "";

            } else {

                product.style.display = "none";

            }

        });

    });

}
function setupPermissions() {

    if (!currentUser) return;

    document.querySelectorAll(".product").forEach(product => {

        const button = product.querySelector("button");

        if (!button) return;

        if (product.classList.contains("premium")) {

            if (currentUser.id !== OWNER_ID && !currentUser.premium) {

                button.textContent = "⭐ Kup Premium";
                button.disabled = true;

            }

        }

        if (product.classList.contains("subscriber")) {

            if (
                currentUser.id !== OWNER_ID &&
                !currentUser.subscriber &&
                !currentUser.premium
            ) {

                button.textContent = "💎 Wymaga Subskrybenta";
                button.disabled = true;

            }

        }

    });

}
function setupTabs() {

    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            tabs.forEach(t => t.classList.remove("active"));

            tab.classList.add("active");

            // Tutaj później dodamy filtrowanie:
            // Pluginy / Skrypty / Grafiki

        });

    });

}

async function startMarketplace() {

    await loadUser();

    setupSearch();

    setupPermissions();

    setupTabs();

}

window.addEventListener("DOMContentLoaded", () => {

    startMarketplace();

});

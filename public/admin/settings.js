const OWNER_ID = "1238570679465410571";

const states = {};

async function loadSettings() {

    try {

        const userRes = await fetch("/api/user");
        const user = await userRes.json();

        if (!user.logged) {

            location.href = "/";
            return;

        }

        if (user.id !== OWNER_ID) {

            location.href = "/dashboard";
            return;

        }

        const res = await fetch("/api/settings");
        const data = await res.json();

        Object.assign(states, data);

        updateStatus();

    } catch (err) {

        console.error(err);

        alert("Nie udało się pobrać ustawień.");

    }

}
function updateStatus() {

    document.getElementById("creatorsStatus").textContent =
        states.creators ? "🟢 Włączone" : "🔴 Wyłączone";

    document.getElementById("pluginsStatus").textContent =
        states.plugins ? "🟢 Włączone" : "🔴 Wyłączone";

    document.getElementById("scriptsStatus").textContent =
        states.scripts ? "🟢 Włączone" : "🔴 Wyłączone";

    document.getElementById("premiumStatus").textContent =
        states.premium ? "🟢 Włączone" : "🔴 Wyłączone";

    document.getElementById("maintenanceStatus").textContent =
        states.maintenance ? "🟢 Włączona" : "🔴 Wyłączona";

    document.getElementById("statusCreators").textContent =
        states.creators ? "Włączone" : "Wyłączone";

    document.getElementById("statusPlugins").textContent =
        states.plugins ? "Włączone" : "Wyłączone";

    document.getElementById("statusScripts").textContent =
        states.scripts ? "Włączone" : "Wyłączone";

    document.getElementById("statusPremium").textContent =
        states.premium ? "Włączone" : "Wyłączone";

    document.getElementById("statusMaintenance").textContent =
        states.maintenance ? "Włączona" : "Wyłączona";

}
async function toggleSetting(key) {

    try {

        const res = await fetch(`/api/settings/toggle/${key}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await res.json();

        if (!data.success) {

            alert(data.message || "Wystąpił błąd.");
            return;

        }

        states[key] = data.value;

        updateStatus();

    } catch (err) {

        console.error(err);

        alert("Nie udało się zmienić ustawienia.");

    }

}
document
.getElementById("creatorsBtn")
.addEventListener("click", () => {
    toggleSetting("creators");
});

document
.getElementById("pluginsBtn")
.addEventListener("click", () => {
    toggleSetting("plugins");
});

document
.getElementById("scriptsBtn")
.addEventListener("click", () => {
    toggleSetting("scripts");
});

document
.getElementById("premiumBtn")
.addEventListener("click", () => {
    toggleSetting("premium");
});

document
.getElementById("maintenanceBtn")
.addEventListener("click", () => {
    toggleSetting("maintenance");
});

window.addEventListener("load", () => {
    loadSettings();
});

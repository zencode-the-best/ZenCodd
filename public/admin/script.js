const OWNER_ID = "1238570679465410571";

const statusMap = {
    creators: {
        top: "creatorsStatus",
        bottom: "statusCreators"
    },
    plugins: {
        top: "pluginsStatus",
        bottom: "statusPlugins"
    },
    scripts: {
        top: "scriptsStatus",
        bottom: "statusScripts"
    },
    premium: {
        top: "premiumStatus",
        bottom: "statusPremium"
    },
    maintenance: {
        top: "maintenanceStatus",
        bottom: "statusMaintenance"
    }
};

let config = {};
function updateUI() {

    Object.keys(statusMap).forEach(key => {

        const enabled = config[key];

        const top = document.getElementById(statusMap[key].top);
        const bottom = document.getElementById(statusMap[key].bottom);

        if (!top || !bottom) return;

        if (enabled) {

            top.textContent = "🟢 ON";
            bottom.textContent = "Włączone";

        } else {

            top.textContent = "🔴 OFF";
            bottom.textContent = "Wyłączone";

        }

    });

}

async function loadConfig() {

    const res = await fetch("/api/settings");

    config = await res.json();

    updateUI();

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

            alert(data.message || "Nie udało się zmienić ustawienia.");
            return;

        }

        config[key] = data.value;

        updateUI();

    } catch (err) {

        console.error(err);

        alert("Błąd połączenia z serwerem.");

    }

}

document.getElementById("creatorsBtn").onclick = () => toggleSetting("creators");
document.getElementById("pluginsBtn").onclick = () => toggleSetting("plugins");
document.getElementById("scriptsBtn").onclick = () => toggleSetting("scripts");
document.getElementById("premiumBtn").onclick = () => toggleSetting("premium");
document.getElementById("maintenanceBtn").onclick = () => toggleSetting("maintenance");
async function checkAccess() {

    try {

        const res = await fetch("/api/user");
        const user = await res.json();

        if (!user.logged) {

            location.href = "/";
            return;

        }

        if (user.id !== OWNER_ID) {

            location.href = "/dashboard";
            return;

        }

        await loadConfig();

    } catch (err) {

        console.error(err);

        alert("Nie udało się zweryfikować użytkownika.");

    }

}

window.addEventListener("load", () => {

    checkAccess();

});

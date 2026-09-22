const API = "/api/hosting";

document.addEventListener("DOMContentLoaded", async () => {

  setupTabs();
  setupButtons();

  await loadStats();
  await loadServices();
  await loadCodes();
});

async function api(url, options = {}) {

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `HTTP ${response.status}`
    );
  }

  return data;
}

function setupTabs() {

  const buttons =
    document.querySelectorAll("[data-tab]");

  buttons.forEach(button => {

    button.addEventListener("click", () => {

      const tab = button.dataset.tab;

      buttons.forEach(item =>
        item.classList.remove("active")
      );

      button.classList.add("active");

      document.querySelectorAll(".tab")
        .forEach(section =>
          section.classList.remove("active")
        );

      const selected =
        document.getElementById(`tab-${tab}`);

      if (selected) {
        selected.classList.add("active");
      }

      const titles = {
        dashboard: "Dashboard CEO",
        users: "Użytkownicy",
        wallets: "Portfele",
        services: "Wszystkie usługi",
        codes: "Kody rabatowe",
        settings: "Zarządzanie"
      };

      document.getElementById("pageTitle")
        .textContent = titles[tab] || "CEO";
    });
  });

  const hash =
    location.hash.replace("#", "");

  if (hash) {

    const button =
      document.querySelector(`[data-tab="${hash}"]`);

    if (button) {
      button.click();
    }
  }
}

function setupButtons() {

  document
    .getElementById("searchUserButton")
    ?.addEventListener("click", searchUser);

  document
    .getElementById("loadWalletButton")
    ?.addEventListener("click", loadWallet);

  document
    .getElementById("refreshServicesButton")
    ?.addEventListener("click", loadServices);

  document
    .getElementById("createCodeButton")
    ?.addEventListener("click", createCode);

  document
    .getElementById("reloadAllButton")
    ?.addEventListener("click", async () => {
      await loadStats();
      await loadServices();
      await loadCodes();
    });
}

async function loadStats() {

  try {

    const data =
      await api(`${API}/admin/stats`);

    const stats =
      data.stats || data;

    setText(
      "statServices",
      stats.services ??
      stats.totalServices ??
      0
    );

    setText(
      "statUsers",
      stats.users ??
      stats.totalUsers ??
      0
    );

    setText(
      "statActive",
      stats.active ??
      stats.activeServices ??
      0
    );

    setText(
      "statRevenue",
      `${Number(
        stats.revenue ??
        stats.totalRevenue ??
        0
      ).toFixed(2)} zł`
    );

  } catch (error) {

    console.error("Stats:", error);
  }
}

async function loadServices() {

  const table =
    document.getElementById("servicesTable");

  if (!table) return;

  table.innerHTML =
    `<tr><td colspan="6">Ładowanie...</td></tr>`;

  try {

    const data =
      await api(`${API}/admin/services`);

    const services =
      Array.isArray(data)
        ? data
        : data.services || [];

    if (!services.length) {

      table.innerHTML =
        `<tr><td colspan="6">Brak usług.</td></tr>`;

      return;
    }

    table.innerHTML =
      services.map(service => `

        <tr>

          <td>${escapeHtml(service.id)}</td>

          <td>
            ${escapeHtml(
              service.userId ||
              service.user?.id ||
              "-"
            )}
          </td>

          <td>
            ${escapeHtml(service.type || "-")}
          </td>

          <td>
            ${escapeHtml(service.package || "-")}
          </td>

          <td>
            ${escapeHtml(service.status || "-")}
          </td>

          <td>

            <button
              class="button danger"
              onclick="deleteService('${escapeAttribute(service.id)}')">
              Usuń
            </button>

          </td>

        </tr>

      `).join("");

  } catch (error) {

    table.innerHTML =
      `<tr><td colspan="6">
        Błąd: ${escapeHtml(error.message)}
      </td></tr>`;
  }
}

async function deleteService(id) {

  if (!id) return;

  const confirmed =
    confirm("Czy na pewno usunąć tę usługę?");

  if (!confirmed) return;

  try {

    await api(
      `${API}/admin/services/${encodeURIComponent(id)}`,
      {
        method: "DELETE"
      }
    );

    await loadServices();
    await loadStats();

  } catch (error) {

    alert(error.message);
  }
}

async function searchUser() {

  const id =
    document.getElementById("userSearch").value.trim();

  const result =
    document.getElementById("userResult");

  if (!id) {
    result.textContent =
      "Podaj ID użytkownika.";
    return;
  }

  try {

    const data =
      await api(
        `${API}/admin/wallet/${encodeURIComponent(id)}`
      );

    const wallet =
      data.wallet || data;

    result.innerHTML = `
      <div class="panel">
        <strong>Użytkownik</strong>
        <p>ID: ${escapeHtml(id)}</p>
        <p>
          Saldo:
          <strong style="color:#f5c542;">
            ${Number(wallet.balance || 0).toFixed(2)} zł
          </strong>
        </p>
      </div>
    `;

  } catch (error) {

    result.textContent =
      error.message;
  }
}

async function loadWallet() {

  const id =
    document.getElementById("walletUserId")
      .value.trim();

  const result =
    document.getElementById("walletResult");

  if (!id) {
    result.textContent =
      "Podaj ID użytkownika.";
    return;
  }

  try {

    const data =
      await api(
        `${API}/admin/wallet/${encodeURIComponent(id)}`
      );

    const wallet =
      data.wallet || data;

    result.innerHTML = `
      <p>
        Użytkownik:
        <strong>${escapeHtml(id)}</strong>
      </p>

      <p>
        Saldo:
        <strong style="color:#f5c542;">
          ${Number(wallet.balance || 0).toFixed(2)} zł
        </strong>
      </p>
    `;

  } catch (error) {

    result.textContent =
      error.message;
  }
}

async function createCode() {

  const code =
    document.getElementById("newCode")
      .value.trim();

  const percent =
    Number(
      document.getElementById("newPercent").value
    );

  const message =
    document.getElementById("codeMessage");

  if (!code || !percent) {

    message.textContent =
      "Podaj kod i procent rabatu.";

    return;
  }

  try {

    await api(`${API}/admin/codes`, {
      method: "POST",

      body: JSON.stringify({
        code,
        percent
      })
    });

    message.textContent =
      "Kod został utworzony.";

    document.getElementById("newCode").value = "";
    document.getElementById("newPercent").value = "";

    await loadCodes();

  } catch (error) {

    message.textContent =
      error.message;
  }
}

async function loadCodes() {

  const container =
    document.getElementById("codesList");

  if (!container) return;

  try {

    const data =
      await api(`${API}/admin/codes`);

    const codes =
      Array.isArray(data)
        ? data
        : data.codes || [];

    if (!codes.length) {

      container.innerHTML =
        "<p>Brak kodów.</p>";

      return;
    }

    container.innerHTML =
      codes.map(code => `

        <div class="panel">

          <strong>
            ${escapeHtml(
              code.code ||
              code.name ||
              "-"
            )}
          </strong>

          <p>
            Rabat:
            ${Number(
              code.percent ??
              code.discount ??
              0
            )}%
          </p>

          <p>
            Status:
            ${code.active === false
              ? "Wyłączony"
              : "Aktywny"}
          </p>

        </div>

      `).join("");

  } catch (error) {

    container.innerHTML =
      `<p>${escapeHtml(error.message)}</p>`;
  }
}

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {

  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}

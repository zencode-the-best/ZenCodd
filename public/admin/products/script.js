const OWNER_ID = "1238570679465410571";

let products = [];
let editingProductId = null;

async function loadUser() {

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

        const userBox = document.getElementById("userBox");

        if (userBox) {

            userBox.innerHTML = `
                <img src="${user.avatar}" alt="Avatar">
                <span>${user.username}</span>
            `;

        }

    } catch (error) {

        console.error("Błąd podczas sprawdzania użytkownika:", error);

    }

}
async function loadProducts() {

    try {

        const res = await fetch("/api/products");

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        products = await res.json();

        if (!Array.isArray(products)) {
            products = [];
        }

        renderProducts();

    } catch (error) {

        console.error(
            "Błąd podczas pobierania produktów:",
            error
        );

        const tbody = document.getElementById("productsBody");

        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        ❌ Nie udało się pobrać produktów.
                    </td>
                </tr>
            `;

        }

    }

}

function renderProducts() {

    const tbody = document.getElementById("productsBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (products.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Brak produktów.
                </td>
            </tr>
        `;

        return;

    }

    products.forEach(product => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${product.id}</td>

            <td>${escapeHtml(product.name || "Bez nazwy")}</td>

            <td>${escapeHtml(product.type || "-")}</td>

            <td>${escapeHtml(product.access || "-")}</td>

            <td>${product.downloads ?? 0}</td>

            <td>

                <button
                    class="edit-btn"
                    onclick="editProduct(${product.id})">
                    ✏️
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteProduct(${product.id})">
                    🗑️
                </button>

            </td>
        `;

        tbody.appendChild(row);

    });

}

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

}
async function addProduct(event) {

    event.preventDefault();

    const product = {

        name: document
            .getElementById("name")
            .value
            .trim(),

        description: document
            .getElementById("description")
            .value
            .trim(),

        type: document
            .getElementById("type")
            .value,

        access: document
            .getElementById("access")
            .value,

        image: document
            .getElementById("image")
            .value
            .trim(),

        download: document
            .getElementById("download")
            .value
            .trim()

    };

    if (!product.name) {

        alert("❌ Podaj nazwę produktu.");

        return;

    }

    try {

        const isEditing =
            editingProductId !== null;

        const url = isEditing
            ? `/api/products/${editingProductId}`
            : "/api/products";

        const method = isEditing
            ? "PUT"
            : "POST";

        const res = await fetch(url, {

            method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(product)

        });

        const data = await res.json();

        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Nie udało się zapisać produktu."
            );

            return;

        }

        document
            .getElementById("productForm")
            .reset();

        editingProductId = null;

        setCreateMode();

        await loadProducts();

        alert(
            isEditing
                ? "💾 Produkt został zaktualizowany."
                : "✅ Produkt został dodany."
        );

    } catch (error) {

        console.error(
            "Błąd podczas zapisywania produktu:",
            error
        );

        alert(
            "❌ Wystąpił błąd podczas komunikacji z serwerem."
        );

    }

}
function editProduct(id) {

    const product = products.find(
        item => Number(item.id) === Number(id)
    );

    if (!product) {

        alert("❌ Nie znaleziono produktu.");

        return;

    }

    editingProductId = Number(id);

    document.getElementById("name").value =
        product.name || "";

    document.getElementById("description").value =
        product.description || "";

    document.getElementById("type").value =
        product.type || "plugin";

    document.getElementById("access").value =
        product.access || "free";

    document.getElementById("image").value =
        product.image || "";

    document.getElementById("download").value =
        product.download || "";

    setEditMode();

    document.getElementById("productForm").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}
function setEditMode() {

    const form = document.getElementById("productForm");

    if (!form) {
        return;
    }

    const submitButton =
        form.querySelector('button[type="submit"]');

    if (submitButton) {

        submitButton.textContent =
            "💾 Zapisz zmiany";

    }

    const cancelButton =
        document.getElementById("cancelEdit");

    if (cancelButton) {

        cancelButton.style.display =
            "inline-block";

    }

}

function setCreateMode() {

    const form = document.getElementById("productForm");

    if (!form) {
        return;
    }

    const submitButton =
        form.querySelector('button[type="submit"]');

    if (submitButton) {

        submitButton.textContent =
            "➕ Dodaj produkt";

    }

    const cancelButton =
        document.getElementById("cancelEdit");

    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }

}
function cancelEdit() {

    editingProductId = null;

    const form = document.getElementById("productForm");

    if (form) {
        form.reset();
    }

    setCreateMode();

}

async function deleteProduct(id) {

    const product = products.find(
        item => Number(item.id) === Number(id)
    );

    const productName =
        product?.name || `#${id}`;

    const confirmed = confirm(
        `Czy na pewno chcesz usunąć produkt "${productName}"?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const res = await fetch(
            `/api/products/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {

            alert(
                data.message ||
                "Nie udało się usunąć produktu."
            );

            return;

        }

        if (
            editingProductId !== null &&
            Number(editingProductId) === Number(id)
        ) {

            cancelEdit();

        }

        await loadProducts();

        alert("🗑️ Produkt został usunięty.");

    } catch (error) {

        console.error(
            "Błąd podczas usuwania produktu:",
            error
        );

        alert(
            "❌ Wystąpił błąd podczas usuwania produktu."
        );

    }

}
function setupProductForm() {

    const form =
        document.getElementById("productForm");

    if (!form) {

        console.error(
            "Nie znaleziono #productForm."
        );

        return;

    }

    form.addEventListener(
        "submit",
        addProduct
    );

    const cancelButton =
        document.getElementById("cancelEdit");

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            cancelEdit
        );

    }

    setCreateMode();

}

async function initializeProductsPage() {

    await loadUser();

    setupProductForm();

    await loadProducts();

}
window.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeProductsPage();

    }
);

const params = new URLSearchParams(window.location.search);

const serviceId =
    params.get("id");

const serviceType =
    params.get("type") || "discord";

if (!serviceId) {
    showError("Nie podano ID usługi.");
}

if (serviceType !== "discord") {
    window.location.href =
        `/hosting/services/discord/?id=${encodeURIComponent(serviceId)}&type=discord`;
}

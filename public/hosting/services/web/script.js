const params = new URLSearchParams(window.location.search);

const serviceId =
    params.get("id");

const serviceType =
    params.get("type") || "web";

if (!serviceId) {
    showError("Nie podano ID usługi.");
}

if (serviceType !== "web") {
    window.location.href =
        `/hosting/services/web/?id=${encodeURIComponent(serviceId)}&type=web`;
}

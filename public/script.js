async function loadUser() {

    try {

        const res = await fetch("/api/user");
        const data = await res.json();

        const loginBtn = document.querySelector(".login-btn");

        if (!data.logged) {

            loginBtn.innerHTML =
                "🔐 Zaloguj przez Discord";

            loginBtn.onclick = () => {
                location.href = "/auth/discord";
            };

            return;
        }

        let badge = "";

        if (data.premium)
            badge = "⭐ PREMIUM";

        if (data.subscriber)
            badge = "👑 SUB";

        loginBtn.innerHTML = `
            <img src="${data.avatar}"
            style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;">
            ${data.username}
            ${badge}
        `;

        loginBtn.onclick = () => {
            location.href = "/logout";
        };

    } catch (err) {
        console.log(err);
    }

}

loadUser();

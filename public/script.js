console.log(`
=================================
🚀 ZenCode Studio
✅ Frontend załadowany
=================================
`);

const loginBtn = document.querySelector(".login-btn");

async function loadUser() {
    try {
        const res = await fetch("/api/user");
        const data = await res.json();

        if (!data.logged) return;

        loginBtn.innerHTML = `
            <img src="${data.user.avatar}" 
            style="width:32px;height:32px;border-radius:50%;margin-right:8px;">
            ${data.user.username}
        `;

        loginBtn.onclick = () => {
            window.location.href = "/logout";
        };

    } catch (err) {
        console.error(err);
    }
}

loginBtn.addEventListener("click", () => {
    window.location.href = "/auth/discord";
});

loadUser();

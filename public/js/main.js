const ZenityCode = {

    user: null,

    async getUser() {

        try {

            const response = await fetch("/api/user");
            const data = await response.json();

            this.user = data;

            return data;

        } catch (err) {

            console.error(err);

            return {
                logged: false
            };

        }

    },

    isOwner() {

        return this.user &&
            this.user.id === "1238570679465410571";

    },

    async requireLogin() {

        const user = await this.getUser();

        if (!user.logged) {

            window.location.href = "/auth/discord";

            return false;

        }

        return true;

    },

    async requireOwner() {

        const ok = await this.requireLogin();

        if (!ok) return;

        if (!this.isOwner()) {

            document.body.innerHTML = `

            <div style="
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
                font-family:Arial;
                background:#09090b;
                color:white;
                flex-direction:column;
            ">

                <h1>⛔ Brak dostępu</h1>

                <p>Tylko właściciel ZenityCode może wejść tutaj.</p>

            </div>

            `;

        }

    },

    formatDate(date) {

        return new Date(date).toLocaleDateString("pl-PL");

    }

};

window.ZenityCode = ZenityCode;

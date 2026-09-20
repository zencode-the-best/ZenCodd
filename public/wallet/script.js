let selectedAmount = null;
let selectedMethod = null;


const balanceElement =
    document.getElementById(
        "balance"
    );

const customAmount =
    document.getElementById(
        "customAmount"
    );

const topupButton =
    document.getElementById(
        "topupButton"
    );

const messageElement =
    document.getElementById(
        "message"
    );

const transactionsElement =
    document.getElementById(
        "transactions"
    );


function formatMoney(
    amount
) {

    return Number(amount || 0)
        .toLocaleString(
            "pl-PL",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ) + " zł";

}


async function loadWallet() {

    try {

        const response =
            await fetch(
                "/api/wallet"
            );

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Nie udało się pobrać portfela."
            );

        }


        balanceElement.textContent =
            formatMoney(
                data.balance
            );


    } catch (error) {

        balanceElement.textContent =
            "Błąd";

        console.error(error);

    }

}


async function loadTransactions() {

    try {

        const response =
            await fetch(
                "/api/wallet/transactions"
            );

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Nie udało się pobrać historii."
            );

        }


        if (
            !data.transactions ||
            data.transactions.length === 0
        ) {

            transactionsElement.innerHTML = `
                <p class="loading">
                    Brak transakcji.
                </p>
            `;

            return;
        }


        transactionsElement.innerHTML =
            data.transactions
                .map(
                    transaction => {

                        const date =
                            new Date(
                                transaction.createdAt
                            ).toLocaleString(
                                "pl-PL"
                            );


                        let title =
                            "Transakcja";


                        if (
                            transaction.type ===
                            "topup"
                        ) {

                            title =
                                "💳 Doładowanie portfela";

                        }


                        const status =
                            transaction.status ||
                            "pending";


                        return `
                            <div class="transaction">

                                <div>

                                    <div class="transaction-title">
                                        ${title}
                                    </div>

                                    <div class="transaction-info">
                                        ${date}
                                        •
                                        ${transaction.method || "—"}
                                        •
                                        ${status}
                                    </div>

                                </div>

                                <div class="transaction-amount ${status}">
                                    +${formatMoney(transaction.amount)}
                                </div>

                            </div>
                        `;

                    }
                )
                .join("");


    } catch (error) {

        transactionsElement.innerHTML = `
            <p class="loading">
                Nie udało się pobrać historii.
            </p>
        `;

        console.error(error);

    }

}


document
    .querySelectorAll(
        ".amounts button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".amounts button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "selected"
                                )
                        );


                    button.classList.add(
                        "selected"
                    );


                    selectedAmount =
                        Number(
                            button.dataset.amount
                        );


                    customAmount.value =
                        "";

                }
            );

        }
    );


customAmount.addEventListener(
    "input",
    () => {

        document
            .querySelectorAll(
                ".amounts button"
            )
            .forEach(
                item =>
                    item.classList.remove(
                        "selected"
                    )
            );


        selectedAmount = null;

    }
);


document
    .querySelectorAll(
        ".method"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".method"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "selected"
                                )
                        );


                    button.classList.add(
                        "selected"
                    );


                    selectedMethod =
                        button.dataset.method;

                }
            );

        }
    );


topupButton.addEventListener(
    "click",
    async () => {

        messageElement.textContent =
            "";


        let amount =
            selectedAmount;


        if (!amount) {

            amount =
                Number(
                    customAmount.value
                );

        }


        if (
            !Number.isFinite(amount) ||
            amount < 1 ||
            amount > 1000
        ) {

            messageElement.textContent =
                "Podaj kwotę od 1 do 1000 zł.";

            return;

        }


        if (!selectedMethod) {

            messageElement.textContent =
                "Wybierz metodę płatności.";

            return;

        }


        topupButton.disabled =
            true;


        try {

            const response =
                await fetch(
                    "/api/wallet/topup",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                amount,
                                method:
                                    selectedMethod
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Nie udało się utworzyć doładowania."
                );

            }


            messageElement.textContent =
                "Doładowanie zostało utworzone. Po potwierdzeniu płatności saldo zostanie zwiększone.";


            await loadTransactions();


        } catch (error) {

            messageElement.textContent =
                error.message;

        } finally {

            topupButton.disabled =
                false;

        }

    }
);


loadWallet();
loadTransactions();

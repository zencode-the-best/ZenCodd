const tabs =
    document.querySelectorAll(
        ".tab"
    );

const contents =
    document.querySelectorAll(
        ".tab-content"
    );


tabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            tabs.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

            contents.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

            tab.classList.add(
                "active"
            );

            document
                .getElementById(
                    tab.dataset.tab
                )
                .classList.add(
                    "active"
                );

        }
    );

});


document
    .getElementById(
        "sendCommand"
    )
    .addEventListener(
        "click",
        () => {

            const input =
                document.getElementById(
                    "commandInput"
                );

            const command =
                input.value.trim();

            if (!command) {
                return;
            }

            const output =
                document.getElementById(
                    "consoleOutput"
                );

            output.innerHTML +=
                `<br><span style="color:#3d8bff">></span> ${escapeHTML(command)}`;

            input.value = "";

            output.scrollTop =
                output.scrollHeight;

        }
    );


document
    .querySelectorAll(
        "[data-node]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "nodeVersion"
                    )
                    .textContent =
                    `Node.js ${button.dataset.node}`;

            }
        );

    });


document
    .getElementById(
        "saveSettings"
    )
    .addEventListener(
        "click",
        () => {

            const name =
                document.getElementById(
                    "serviceName"
                ).value.trim();

            if (!name) {
                return;
            }

            document.getElementById(
                "botName"
            ).textContent =
                name;

        }
    );


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

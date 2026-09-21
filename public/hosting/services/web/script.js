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

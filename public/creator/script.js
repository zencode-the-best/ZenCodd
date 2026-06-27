async function generate() {

    const topText =
        document.getElementById("topText").value || "ZET";

    const bottomText =
        document.getElementById("bottomText").value || "SIGMA";

    const topColor =
        document.getElementById("topColor").value;

    const bottomColor =
        document.getElementById("bottomColor").value;

    const canvas =
        document.getElementById("canvas");

    const ctx =
        canvas.getContext("2d");

    /* TŁO */

    const bg =
        ctx.createLinearGradient(
            0,
            0,
            1200,
            600
        );

    bg.addColorStop(0, "#050816");
    bg.addColorStop(1, "#08142b");

    ctx.fillStyle = bg;
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    /* LINIE */

    ctx.strokeStyle =
        "rgba(255,255,255,.05)";

    for (let i = 0; i < 1200; i += 40) {

        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();

    }

    /* GÓRNY NAPIS */

    ctx.textAlign = "center";

    ctx.font =
        "bold 150px Arial";

    ctx.shadowBlur = 35;
    ctx.shadowColor = topColor;

    ctx.fillStyle = topColor;

    ctx.fillText(
        topText.toUpperCase(),
        600,
        250
    );

    /* DOLNY */

    ctx.font =
        "bold 90px Arial";

    ctx.shadowBlur = 25;
    ctx.shadowColor = bottomColor;

    ctx.fillStyle = bottomColor;

    ctx.fillText(
        bottomText.toUpperCase(),
        600,
        360
    );

    /* FREE */

    ctx.shadowBlur = 0;

    ctx.font =
        "28px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        "ZenCode FREE",
        600,
        560
    );

    const download =
        document.getElementById("download");

    download.href =
        canvas.toDataURL("image/png");

    download.style.display =
        "inline-block";

    /* LOG DISCORD */

    try {

        await fetch("/api/log-create", {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                creator:
                    "Grafika Creator"

            })

        });

    } catch (e) {

        console.log(e);

    }

}

/* AUTOMATYCZNY START */

generate();

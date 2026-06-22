function updateColor() {

    const color = document.getElementById("colorPicker").value;

    const preview = document.getElementById("colorPreview");

    preview.innerText = color;
    preview.style.color = color;
}

function generate() {

    const topText =
        document.getElementById("topText").value || "ZET";

    const bottomText =
        document.getElementById("bottomText").value || "SIGMA";

    const color =
        document.getElementById("colorPicker").value;

    const canvas =
        document.getElementById("canvas");

    const ctx =
        canvas.getContext("2d");

    ctx.fillStyle = "#08142b";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign = "center";

    ctx.fillStyle = color;

    ctx.font = "bold 130px Arial";
    ctx.fillText(
        topText,
        500,
        190
    );

    ctx.font = "bold 110px Arial";
    ctx.fillText(
        bottomText,
        500,
        340
    );

    ctx.font = "28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
        "ZenCode FREE",
        500,
        450
    );

    const link =
        document.getElementById("download");

    link.href =
        canvas.toDataURL("image/png");

    link.style.display =
        "inline-block";
}

updateColor();

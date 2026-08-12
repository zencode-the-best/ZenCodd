async function generate() {

const topText =
    document.getElementById("topText").value.trim() || "PIOTRK";

const bottomText =
    document.getElementById("bottomText").value.trim() || "SIGMA";

const topColor =
    document.getElementById("topColor").value;

const bottomColor =
    document.getElementById("bottomColor").value;

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;


/*
 * CZYSTE, PROFESJONALNE TŁO
 * Bez neonów i świecenia.
 */

ctx.clearRect(
    0,
    0,
    width,
    height
);

ctx.fillStyle =
    "#08111f";

ctx.fillRect(
    0,
    0,
    width,
    height
);


/*
 * DELIKATNA SIATKA
 */

ctx.strokeStyle =
    "rgba(255,255,255,0.035)";

ctx.lineWidth = 1;

for (
    let x = 0;
    x <= width;
    x += 50
) {

    ctx.beginPath();

    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);

    ctx.stroke();

}

for (
    let y = 0;
    y <= height;
    y += 50
) {

    ctx.beginPath();

    ctx.moveTo(0, y);
    ctx.lineTo(width, y);

    ctx.stroke();

}


/*
 * GÓRNY NAPIS
 */

ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.shadowBlur = 0;
ctx.shadowColor = "transparent";

ctx.font =
    "900 150px Arial";

ctx.fillStyle =
    topColor;

ctx.fillText(
    topText.toUpperCase(),
    width / 2,
    225
);


/*
 * SEPARATOR
 */

ctx.fillStyle =
    "rgba(255,255,255,0.12)";

ctx.fillRect(
    350,
    305,
    500,
    2
);


/*
 * DOLNY NAPIS
 */

ctx.font =
    "800 90px Arial";

ctx.fillStyle =
    bottomColor;

ctx.fillText(
    bottomText.toUpperCase(),
    width / 2,
    380
);


/*
 * STOPKA
 */

ctx.font =
    "600 28px Arial";

ctx.fillStyle =
    "rgba(255,255,255,0.65)";

ctx.fillText(
    "ZenityCode Studio",
    width / 2,
    545
);


/*
 * PRZYGOTOWANIE PNG
 */

const download =
    document.getElementById("download");

download.href =
    canvas.toDataURL("image/png");

download.style.display =
    "inline-block";


/*
 * LOGOWANIE UŻYCIA CREATORA
 */

try {

    await fetch(
        "/api/log-create",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                creator:
                    "Grafika Creator"
            })
        }
    );

} catch (error) {

    console.log(
        "Nie udało się zapisać logu:",
        error
    );

}

}

/*

* AUTOMATYCZNE WYGENEROWANIE
* przy otwarciu strony.
  */

window.addEventListener(
"DOMContentLoaded",
() => {

    generate();

}

);

function generate(){

    const text = document.getElementById("text").value || "ZET";
    const color = document.getElementById("color").value;

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#08142b";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.font = "bold 120px Arial";
    ctx.textAlign = "center";

    ctx.fillStyle = color;
    ctx.fillText(text, 500, 250);

    ctx.font = "30px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ZenCode FREE", 500, 430);

    const link = document.getElementById("download");

    link.href = canvas.toDataURL("image/png");
    link.style.display = "inline-block";
}

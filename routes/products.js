const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const productsFile = path.join(
    __dirname,
    "..",
    "data",
    "products.json"
);

function getProducts() {

    if (!fs.existsSync(productsFile)) {
        return [];
    }

    try {

        const data = fs.readFileSync(
            productsFile,
            "utf8"
        );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Błąd odczytu products.json:",
            error
        );

        return [];

    }

}
function saveProducts(products) {

    fs.writeFileSync(
        productsFile,
        JSON.stringify(
            products,
            null,
            4
        ),
        "utf8"
    );

}

router.get("/", (req, res) => {

    const products = getProducts();

    res.json(products);

});

router.get("/:id", (req, res) => {

    const id = Number(req.params.id);

    const products = getProducts();

    const product = products.find(
        item => Number(item.id) === id
    );

    if (!product) {

        return res.status(404).json({
            success: false,
            message: "Produkt nie został znaleziony."
        });

    }

    res.json({
        success: true,
        product
    });

});
router.post("/", (req, res) => {

    const products = getProducts();

    const {
        name,
        description,
        type,
        access,
        image,
        download
    } = req.body;

    if (!name || !name.trim()) {

        return res.status(400).json({
            success: false,
            message: "Nazwa produktu jest wymagana."
        });

    }

    const ids = products
        .map(product => Number(product.id))
        .filter(Number.isFinite);

    const nextId = ids.length > 0
        ? Math.max(...ids) + 1
        : 1;

    const newProduct = {

        id: nextId,

        name: name.trim(),

        description:
            typeof description === "string"
                ? description.trim()
                : "",

        type:
            typeof type === "string"
                ? type
                : "plugin",

        access:
            typeof access === "string"
                ? access
                : "free",

        image:
            typeof image === "string"
                ? image.trim()
                : "",

        download:
            typeof download === "string"
                ? download.trim()
                : "",

        downloads: 0

    };

    products.push(newProduct);

    saveProducts(products);

    res.status(201).json({
        success: true,
        message: "Produkt został dodany.",
        product: newProduct
    });

});
router.put("/:id", (req, res) => {

    const id = Number(req.params.id);

    const products = getProducts();

    const product = products.find(
        item => Number(item.id) === id
    );

    if (!product) {

        return res.status(404).json({
            success: false,
            message: "Produkt nie został znaleziony."
        });

    }

    const {
        name,
        description,
        type,
        access,
        image,
        download
    } = req.body;

    if (
        typeof name === "string" &&
        name.trim()
    ) {
        product.name = name.trim();
    }

    if (typeof description === "string") {
        product.description = description.trim();
    }

    if (typeof type === "string") {
        product.type = type;
    }

    if (typeof access === "string") {
        product.access = access;
    }

    if (typeof image === "string") {
        product.image = image.trim();
    }

    if (typeof download === "string") {
        product.download = download.trim();
    }

    saveProducts(products);

    res.json({
        success: true,
        message: "Produkt został zaktualizowany.",
        product
    });

});
router.delete("/:id", (req, res) => {

    const id = Number(req.params.id);

    const products = getProducts();

    const index = products.findIndex(
        product => Number(product.id) === id
    );

    if (index === -1) {

        return res.status(404).json({
            success: false,
            message: "Produkt nie został znaleziony."
        });

    }

    const deletedProduct = products[index];

    products.splice(index, 1);

    saveProducts(products);

    res.json({
        success: true,
        message: "Produkt został usunięty.",
        product: deletedProduct
    });

});

module.exports = router;

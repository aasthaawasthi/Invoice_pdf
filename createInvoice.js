
const fs = require("fs");
const PDFDocument = require("pdfkit");
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
let app = express();

mongoose.connect('mongodb://localhost:27017/invoice', { useNewUrlParser: true });
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ useNewUrlParser: true }));
app.use(bodyParser.json());

function createInvoice(invoice, path) {
    let doc = new PDFDocument({ size: "A4", margin: 50 });

    generateLogo(doc);
    generateHeader(doc, invoice);
    generateCustomerInformation(doc, invoice);
    generateInvoiceTable(doc, invoice);
    generateMethodTable(doc, invoice);
    generateFooter(doc, invoice);

    doc.end();
    let docFile = doc.pipe(fs.createWriteStream(path));
    return docFile;
}

function generateLogo(doc) {
    doc
        .image("/home/parangat-pt-p10/Desktop/logo.png", 500, 20, { width: 70 }, { align: "right" });
    return doc;
}

function generateHeader(doc, invoice) {
    doc
        .fontSize(20)
        .text("INVOICE", 60, 75)
        .fontSize(10)
        .text("Invoice ID: ", 364, 70)
        .text(invoice.invoice_details.invoice, 180, 70, { align: "right" })
        .text("Order ID: ", 364, 80)
        .text(invoice.invoice_details.order, 200, 80, { align: "right" })
        .text('Date: ', 364, 90)
        .text(invoice.invoice_details.date, 416, 90)
        .moveDown();
    return doc;
}

function generateCustomerInformation(doc, invoice) {
    doc
        .fontSize(10)
    generateHr(doc, 105)
        .font("Helvetica-Bold")
        .text("SOLD TO :", 50, 110);
    generateHr(doc, 122);

    let customerInformationTop = 130;

    doc
        .fontSize(8)
        .text("Name:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.billing.name, 85, customerInformationTop)
        .font("Helvetica")
        .text("Address:", 50, customerInformationTop + 10)
        .text(invoice.billing.address, 85, customerInformationTop + 10)
        .text(invoice.billing.city + ", " + invoice.billing.state + ", " + invoice.billing.country, 125, customerInformationTop + 10)
        .text("PinCode:", 50, customerInformationTop + 20)
        .text(invoice.billing.postal_code, 85, customerInformationTop + 20)
        .moveDown();

    generateHr(doc, 160);

    doc
    generateHr(doc, 177)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("SHIP TO :", 50, 165);

    customerInformationTop = 187;
    doc
        .fontSize(8)
        .text("Name:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.shipping.name, 85, customerInformationTop)
        .font("Helvetica")
        .text("Address:", 50, customerInformationTop + 10)
        .text(invoice.shipping.address, 85, customerInformationTop + 10)
        .text(invoice.shipping.city + ", " + invoice.shipping.state + ", " + invoice.shipping.country, 148, customerInformationTop + 10)
        .text("Pincode:", 50, customerInformationTop + 20)
        .text(invoice.shipping.postal_code, 85, customerInformationTop + 20)
        .moveDown();
    return doc;
}
let position;  // global variable to store row padding
let positionTable;   // global variable for refernce to position
let cost = 0;  // to calculate grand total= price + shipping charges
let shippingCharges;
function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 220;

    doc.font("Helvetica-Bold");
    generateHr(doc, invoiceTableTop);
    generateTableRow(
        doc,
        invoiceTableTop + 5,
        "Product",
        "Price",
        "Qty",
        "Status",
        "Subtotal "
    );
    generateHr(doc, invoiceTableTop + 19);
    doc.font("Helvetica");

    for (i = 0; i < invoice.products.length; i++) {
        const product = invoice.products[i];
        position = invoiceTableTop + (i + 1) * 25;
        cost = cost + product.price;

        generateTableRow(
            doc,
            position,
            product.product,
            formatCurrency(product.price / product.qty),
            product.qty,
            product.status,
            formatCurrency(product.subtotal)
        );
    }
    return doc;
}

function generateMethodTable(doc, invoice) {
    let i;
    const invoiceTableTop = position + 20;

    doc.font("Helvetica-Bold");
    generateHr(doc, invoiceTableTop);
    generateMethodTableRow(
        doc,
        invoiceTableTop + 5,
        "Payment Method",
        "Shipping Method",
        "Shipping Charges"
    );

    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < invoice.methods.length; i++) {
        const method = invoice.methods[i];
        shippingCharges = method.shipping_charges;
        positionTable = invoiceTableTop + (i + 1) * 30;
        generateMethodTableRow(
            doc,
            positionTable,
            method.payment_method,
            method.shipping_method,
            method.shipping_charges
        );
        return doc;
    }
}

function generateFooter(doc, invoice) {
    doc
        .fontSize(10)
    generateHr(doc, positionTable + 30)
        .font("Helvetica-Bold")
        .text(
            "Grand Total",
            50,
            positionTable + 35,
            { align: "left", width: 500 }
        )
        .fontSize(10)
        .text(
            "INR" + " " + `${cost + shippingCharges}`,
            50,
            positionTable + 35,
            { align: "right", width: 500 }
        );
    generateHr(doc, positionTable + 50)
    return doc;
}

function generateTableRow(
    doc,
    y,
    product,
    price,
    qty,
    status,
    subtotal
) {
    doc
        .fontSize(10)
        .text(product, 50, y)
        .text(price, 250, y)
        .text(qty, 280, y, { width: 90, align: "right" })
        .text(status, 370, y, { width: 90, align: "right" })
        .text(subtotal, 0, y, { align: "right" });
    return doc;
}

//-----------------------------------------
function generateMethodTableRow(
    doc,
    y,
    payment_method,
    shipping_method,
    shipping_charges
) {
    doc
        .fontSize(10)
        .text(payment_method, 50, y)
        .text(shipping_method, 250, y)
        .text(shipping_charges, 410, y);
    return doc;
}
//-----------------------------------------
function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
    return doc;
}

function formatCurrency(cents) {
    return "INR" + " " + (cents);
}

// post api
app.post("/data", (req, res) => {
    let invoicedata = createInvoice(req.body, "/home/parangat-pt-p10/Downloads/invoice.pdf");
    if (!invoicedata) throw Error;
    res.send(invoicedata);
});

// Server listning
app.listen(3000, process.env.IP, () => {
    console.log("Server is listening on port 3000");
});

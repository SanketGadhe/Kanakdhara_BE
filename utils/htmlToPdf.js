const puppeteer = require('puppeteer');
const htmlToPdfBuffer = async (html) => {
    const browser = await puppeteer.launch({
        headless: "new", // or true, depending on version
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
}
module.exports = {
    htmlToPdfBuffer,
};
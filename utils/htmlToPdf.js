const htmlToPdfBuffer = async (html) => {
    if (!process.env.PDFSHIFT_API_KEY) {
        throw new Error("PDFSHIFT_API_KEY is missing");
    }

    const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
        method: "POST",
        headers: {
            "X-API-Key": process.env.PDFSHIFT_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            source: html,
            format: "A4",
            // print_background: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error("PDF generation failed: " + error);
    }

    // IMPORTANT: PDFShift returns PDF as binary, not JSON
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

module.exports = { htmlToPdfBuffer };

import puppeteer from "puppeteer";

/**
 * Génère un PDF à partir d'un contenu HTML (template compilé).
 * @param htmlContent Le HTML à convertir en PDF
 * @returns Un Buffer PDF prêt à être envoyé dans une réponse API
 */
export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: "new", // ou true selon ta version de puppeteer
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // utile sur certains serveurs
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
  });
  await browser.close();
  return pdfBuffer;
}

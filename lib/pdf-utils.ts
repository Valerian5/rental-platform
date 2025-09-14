import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  const executablePath = await chromium.executablePath()

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  })

  const page = await browser.newPage()
  await page.setContent(htmlContent, { waitUntil: "networkidle0" })
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true })
  await browser.close()
  return pdfBuffer
}

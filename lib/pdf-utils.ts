import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  let browser = null
  try {
    // Cette configuration est la plus robuste pour Vercel.
    // Elle s'assure que la version complète de Chromium avec toutes les dépendances est utilisée.
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    return pdfBuffer
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Could not generate PDF.')
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}


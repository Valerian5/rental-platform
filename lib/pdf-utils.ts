import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// On spécifie l'URL de la version "packagée" de Chromium qui inclut les bibliothèques partagées nécessaires.
const chromiumPack = `https://github.com/Sparticuz/chromium/releases/download/v${chromium.revision}/chromium-v${chromium.revision}-pack.tar`

export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  let browser = null
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      // Utilisation de la version "packagée" pour inclure les dépendances manquantes sur Vercel
      executablePath: await chromium.executablePath(chromiumPack),
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


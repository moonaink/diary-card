import boldUrl from '@expo-google-fonts/pt-serif/700Bold/PTSerif_700Bold.ttf?url'
import regularUrl from '@expo-google-fonts/pt-serif/400Regular/PTSerif_400Regular.ttf?url'
import type { PdfFonts } from './renderCardPdf.ts'

let cached: Promise<PdfFonts> | null = null

/** PT Serif, close to the serif of the paper card. Bundled with the app and cached for offline use. */
export function loadPdfFonts(): Promise<PdfFonts> {
  cached ??= Promise.all([fetchBytes(regularUrl), fetchBytes(boldUrl)]).then(([regular, bold]) => ({
    regular,
    bold,
  }))
  // A failed load is not cached, so the next export tries again.
  cached.catch(() => {
    cached = null
  })
  return cached
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Font ${url}: HTTP ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

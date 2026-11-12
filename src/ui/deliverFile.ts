export type DeliveryOutcome = 'shared' | 'downloaded' | 'cancelled' | 'needsTap'

/**
 * Hands a generated file to the user: the share sheet on a phone (save to Files, send to a messenger),
 * a download on a computer.
 *
 * Safari opens the share sheet only right after a tap. When the file took long to prepare, the tap has
 * expired and the result is 'needsTap': the caller shows a button whose click calls this function again.
 */
export async function deliverFile(file: File): Promise<DeliveryOutcome> {
  const touchDevice = window.matchMedia('(pointer: coarse)').matches
  if (touchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      if (error instanceof DOMException && error.name === 'NotAllowedError') return 'needsTap'
      throw error
    }
  }
  downloadFile(file)
  return 'downloaded'
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  // Revoking at once can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

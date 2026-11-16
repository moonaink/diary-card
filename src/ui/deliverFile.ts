export type DeliveryOutcome = 'shared' | 'downloaded' | 'cancelled' | 'needsTap'

export interface DeviceInfo {
  userAgent: string
  platform: string
  maxTouchPoints: number
}

/**
 * iPhone and iPad, where the share sheet is the way a file reaches Files or a messenger. iPadOS reports
 * itself as a Mac, so a "Mac" with a touch screen counts too. A touch screen alone is not enough: on a
 * Windows laptop it would open the Windows share window, which cannot save a file.
 */
export function isAppleMobile(device: DeviceInfo): boolean {
  return (
    /iPhone|iPad|iPod/.test(device.userAgent) ||
    (device.platform === 'MacIntel' && device.maxTouchPoints > 1)
  )
}

/**
 * Hands a generated file to the user: the share sheet on an iPhone or iPad (save to Files, send to a
 * messenger), a download everywhere else.
 *
 * Safari opens the share sheet only right after a tap. When the file took long to prepare, the tap has
 * expired and the result is 'needsTap': the caller shows a button whose click calls this function again.
 */
export async function deliverFile(file: File): Promise<DeliveryOutcome> {
  if (isAppleMobile(navigator) && navigator.canShare?.({ files: [file] })) {
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

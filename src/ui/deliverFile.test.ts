import { describe, expect, it } from 'vitest'
import { isAppleMobile } from './deliverFile.ts'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const IPAD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

describe('isAppleMobile', () => {
  it('is true on an iPhone', () => {
    expect(isAppleMobile({ userAgent: IPHONE_SAFARI, platform: 'iPhone', maxTouchPoints: 5 })).toBe(
      true,
    )
  })

  it('is true on an iPad that reports itself as a Mac', () => {
    expect(isAppleMobile({ userAgent: IPAD_SAFARI, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(
      true,
    )
  })

  it('is false on a Windows laptop with a touch screen', () => {
    expect(
      isAppleMobile({ userAgent: WINDOWS_CHROME, platform: 'Win32', maxTouchPoints: 10 }),
    ).toBe(false)
  })

  it('is false on a Mac without a touch screen', () => {
    expect(isAppleMobile({ userAgent: IPAD_SAFARI, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(
      false,
    )
  })
})

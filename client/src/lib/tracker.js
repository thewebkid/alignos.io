import { track as vercelTrack } from '@vercel/analytics'

function trackingDisabled() {
  return false;//typeof localStorage !== 'undefined' && localStorage.getItem('notrack') === 'true'
}

/**
 * Fire a custom analytics event (no-ops when /notrack opted out).
 * @param {string} event
 * @param {Record<string, string | number | boolean | null | undefined>} [args]
 */
export const track = (event, args) => {
  try {
    if (trackingDisabled()) return
    vercelTrack(event, args)
  } catch {
    console.warn(`analytics track ${event} error`)
  }
}

export { trackingDisabled }

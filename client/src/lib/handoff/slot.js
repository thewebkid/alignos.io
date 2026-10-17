import { findFragment } from './envelope.js'

let pending = null

// Must run before the router is created: its web history reads the URL once, and its first
// navigation would write the fragment back. Running first also keeps it out of analytics.
export function captureHandoff() {
  if (typeof window === 'undefined') return
  const { pathname, search, hash } = window.location
  if (pathname.replace(/\/+$/, '') !== '/import' || !findFragment(hash)) return
  pending = hash
  window.history.replaceState(window.history.state, '', pathname + search)
}

export function takeHandoff() {
  const hash = pending
  pending = null
  return hash
}

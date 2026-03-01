import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'docktogo-zoom'
const DEFAULT_USER_ZOOM = 100
const BASE_SCALE = 0.9
const MIN_ZOOM = 70
const MAX_ZOOM = 130
const STEP = 10

interface ZoomState {
  userZoom: number
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setUserZoom: (value: number) => void
}

const ZoomContext = createContext<ZoomState | null>(null)

function readStoredZoom(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = Number(raw)
      if (!Number.isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) return parsed
    }
  } catch { /* localStorage unavailable */ }
  return DEFAULT_USER_ZOOM
}

function applyZoom(userZoom: number) {
  const realScale = (userZoom / 100) * BASE_SCALE
  document.documentElement.style.zoom = String(realScale)
}

export function ZoomProvider({ children }: { children: ReactNode }) {
  const [userZoom, setUserZoomState] = useState(readStoredZoom)

  useEffect(() => {
    applyZoom(userZoom)
    try { localStorage.setItem(STORAGE_KEY, String(userZoom)) } catch { /* */ }
  }, [userZoom])

  const setUserZoom = useCallback((value: number) => {
    setUserZoomState(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value)))
  }, [])

  const zoomIn = useCallback(() => {
    setUserZoomState((prev) => Math.min(MAX_ZOOM, prev + STEP))
  }, [])

  const zoomOut = useCallback(() => {
    setUserZoomState((prev) => Math.max(MIN_ZOOM, prev - STEP))
  }, [])

  const resetZoom = useCallback(() => {
    setUserZoomState(DEFAULT_USER_ZOOM)
  }, [])

  return (
    <ZoomContext.Provider value={{ userZoom, zoomIn, zoomOut, resetZoom, setUserZoom }}>
      {children}
    </ZoomContext.Provider>
  )
}

export function useZoom() {
  const ctx = useContext(ZoomContext)
  if (!ctx) throw new Error('useZoom must be used within ZoomProvider')
  return ctx
}

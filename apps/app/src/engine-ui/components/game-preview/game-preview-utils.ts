export function sendMessageToGame(iframeRef: React.RefObject<HTMLIFrameElement>, message: Record<string, unknown>) {
  if (iframeRef.current?.contentWindow) {
    iframeRef.current.contentWindow.postMessage(message, '*')
  }
}

export function toggleFullscreen(iframeRef: React.RefObject<HTMLIFrameElement>) {
  if (!iframeRef.current) return

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  } else {
    iframeRef.current.requestFullscreen().catch(() => {})
  }
} 
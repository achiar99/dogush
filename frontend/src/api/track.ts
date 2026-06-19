const API = import.meta.env.VITE_API_BASE_URL || '';

function getSessionId(): string {
  let id = sessionStorage.getItem('_sid');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('_sid', id);
  }
  return id;
}

export function trackPageView() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('src') || params.get('utm_source') || 'direct';

  fetch(`${API}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: window.location.pathname,
      source,
      sessionId: getSessionId(),
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      language: navigator.language,
    }),
    keepalive: true,
  }).catch(() => {});
}

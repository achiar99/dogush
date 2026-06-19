import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || localStorage.getItem('pwa-dismissed')) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone === true;

    if (isIos && !isInStandaloneMode) {
      setShowIosBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  const dismiss = () => {
    setDismissed(true);
    setShowIosBanner(false);
    setDeferredPrompt(null);
    localStorage.setItem('pwa-dismissed', '1');
  };

  if (dismissed || (!deferredPrompt && !showIosBanner)) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 999, width: 'calc(100% - 32px)', maxWidth: 420,
      background: '#1e1e2e', color: '#fff', borderRadius: 16,
      padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'flex-start', gap: 14, direction: 'rtl',
    }}>
      <img src="/images/logo.jpg" alt="Dogush" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>התקן את Dogush</div>
        {showIosBanner ? (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
            לחץ על <span style={{ fontWeight: 700 }}>שתף</span> <span style={{ fontSize: 16 }}>⎙</span> ואז <span style={{ fontWeight: 700 }}>"הוסף למסך הבית"</span>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            הוסף למסך הבית לגישה מהירה
          </div>
        )}
        {deferredPrompt && (
          <button onClick={handleInstall} style={{
            marginTop: 10, padding: '8px 20px', background: '#c15f2a', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            התקן
          </button>
        )}
      </div>
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0, flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

import { useEffect, useState } from 'react';

interface Toast {
  id: number;
  name: string;
  imageFile?: string;
}

let listeners: ((toast: Toast) => void)[] = [];
let nextId = 0;

export function fireCartToast(name: string, imageFile?: string) {
  const toast: Toast = { id: nextId++, name, imageFile };
  listeners.forEach(fn => fn(toast));
}

export default function CartToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 2500);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter(fn => fn !== handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#1e1e2e', color: '#fff',
          padding: '10px 18px', borderRadius: 40,
          fontSize: '0.95rem', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          animation: 'cartToastIn 0.25s ease',
          direction: 'rtl',
          whiteSpace: 'nowrap',
        }}>
          {toast.imageFile
            ? <img src={toast.imageFile} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            : <span>🛒</span>
          }
          <span>נוסף לסל ✓</span>
        </div>
      ))}
    </div>
  );
}

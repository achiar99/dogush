import { useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';

const { strings, currencySymbol, orders: localOrders } = heConfig as any;

interface Order {
  id: string;
  customer: string;
  address: string;
  email: string;
  items: Array<{ id: string; amount: number }>;
  total: number;
  status: string;
  time: string;
}

export default function AdminDashboard() {
  const [orders] = useState<Order[]>(localOrders || []);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const openDetails= (order: Order) => {
    setSelectedOrder({ ...order });
  };

  const handleStatusChange = (status: string) => {
    if (!selectedOrder) return;
    setSelectedOrder({ ...selectedOrder, status });
  };

  // 1. Helper to make the date look better
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return strings.statusPending;
      case 'completed': return strings.statusCompleted;
      case 'cancelled': return strings.statusCancelled;
      default: return status;
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (fromDate && order.time < fromDate) return false;
      if (toDate && order.time > toDate) return false;
      return true;
    });
  }, [orders, fromDate, toDate]);

  return (
    <AdminLayout>
      <h1 style={{ direction: 'rtl', marginBottom: '20px' }}>{strings.adminOrdersTitle}</h1>
      
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, direction: 'rtl', alignItems: 'center' }}>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <span>עד</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'right', padding: '16px 12px' }}>{strings.tableHeaderOrderId}</th>
            <th style={{ textAlign: 'right', padding: '16px 12px' }}>{strings.tableHeaderCustomer}</th>
            <th style={{ textAlign: 'right', padding: '16px 12px' }}>{strings.tableHeaderTotal}</th>
            <th style={{ textAlign: 'center', padding: '16px 12px' }}>{strings.tableHeaderStatus}</th>
            <th style={{ textAlign: 'center', padding: '16px 12px' }}>{strings.tableHeaderTime}</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (      
            <tr key={order.id} onClick={() => openDetails(order)} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 12, fontWeight: 'bold' }}>#{order.id}</td>
              
              {/* 2. Fix: Ensuring Name is visible above the Address */}
              <td style={{ padding: 12 }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}>
                  {order.customer || 'None'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {order.address}
                </div>
              </td>

              <td style={{ padding: 12 }}>{order.total}{currencySymbol}</td>
              
              <td style={{ textAlign: 'center', padding: 12 }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  backgroundColor: order.status === 'completed' ? '#e6f4ea' : '#fff4e5',
                  color: order.status === 'completed' ? '#1e7e34' : '#b45d00'
                }}>
                  {getStatusLabel(order.status)}
                </span>
              </td>

              {/* 3. Apply the better date format */}
              <td style={{ textAlign: 'center', padding: 12, color: '#444' }}>
                {formatDateTime(order.time)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedOrder && (
        <>
          <style>{`
            @media (max-width: 767px) {
              .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #fff;
                z-index: 1000;
                overflow-y: auto;
              }
              .modal-content {
                padding: 16px;
                min-height: 100vh;
              }
              .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 16px;
                border-bottom: 1px solid #ddd;
                margin-bottom: 16px;
              }
              .modal-close-btn {
                display: flex;
                flex-direction: column;
                gap: 5px;
                padding: 8px;
                background: none;
                border: none;
                cursor: pointer;
              }
              .modal-close-btn span {
                display: block;
                width: 25px;
                height: 3px;
                background-color: #333;
                border-radius: 2px;
              }
            }
            @media (min-width: 768px) {
              .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
              }
              .modal-content {
                background-color: #fff;
                padding: 24px;
                border-radius: 8px;
                width: 500px;
                max-height: 80vh;
                overflow-y: auto;
              }
              .mobile-close-btn {
                display: none !important;
              }
            }
          `}</style>
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>{strings.orderModalTitle || 'פרטי הזמנה'}</h2>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="mobile-close-btn"
                  style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', width: 25, height: 3, backgroundColor: '#333', borderRadius: 2 }}></span>
                  <span style={{ display: 'block', width: 25, height: 3, backgroundColor: '#333', borderRadius: 2 }}></span>
                  <span style={{ display: 'block', width: 25, height: 3, backgroundColor: '#333', borderRadius: 2 }}></span>
                </button>
              </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{strings.orderModalId || 'מספר הזמנה'}</label>
              <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4, fontWeight: 'bold' }}>#{selectedOrder!.id}</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{strings.orderModalCustomer || 'לקוח'}</label>
              <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>{selectedOrder!.customer}</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{strings.orderModalAddress || 'כתובת'}</label>
              <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>{selectedOrder!.address}</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{strings.orderModalEmail || 'אימייל'}</label>
              <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>{selectedOrder!.email}</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{strings.orderModalItems || 'פריטים'}</label>
              <ul style={{ margin: 0, padding: '8px 20px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                {selectedOrder!.items.map((item, idx) => (
                  <li key={idx} style={{ direction: 'rtl' }}>
                    <span>ID: {item.id}</span>
                    <span style={{ marginRight: 16 }}>כמות: {item.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{strings.orderModalTotal || 'סכום כולל'}</label>
              <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4, fontWeight: 'bold' }}>{selectedOrder!.total}{currencySymbol}</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{strings.orderModalTime || 'זמן'}</label>
              <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>{formatDateTime(selectedOrder!.time)}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{strings.orderModalStatus || 'סטטוס'}</label>
              <select
                value={selectedOrder!.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{ width: '100%', padding: 8 }}
              >
                <option value="open">{strings.statusPending}</option>
                <option value="completed">{strings.statusCompleted}</option>
                <option value="cancelled">{strings.statusCancelled}</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ padding: '10px 20px', cursor: 'pointer' }}
              >
                {strings.orderModalClose || 'סגור'}
              </button>
            </div>
          </div>
        </div>
        </>
      )}

    </AdminLayout>
  );
}
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';

const { strings, tables } = heConfig as unknown as {
  strings: {
    adminTablesTitle: string;
    tableHeaderTableNumber: string;
    tableHeaderChairs: string;
    tableHeaderAvailable: string;
  };
  tables: Array<{ id: string; tableNumber: number; chairs: number; availableChairs: number }>;
};

export default function Tables() {
  return (
    <AdminLayout>
      <h1>{strings.adminTablesTitle}</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderTableNumber}</th>
            <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderChairs}</th>
            <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderAvailable}</th>
          </tr>
        </thead>
        <tbody>
          {tables.map(table => (
            <tr 
              key={table.id} 
              style={{ 
                borderBottom: '1px solid #eee',
                backgroundColor: table.availableChairs === table.chairs ? '#d4edda' : '#f8d7da',
              }}
            >
              <td style={{ textAlign: 'center', padding: 12 }}>{table.tableNumber}</td>
              <td style={{ textAlign: 'center', padding: 12 }}>{table.chairs}</td>
              <td style={{ 
                textAlign: 'center', 
                padding: 12,
                fontWeight: 'bold'
              }}>
                {table.availableChairs}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}

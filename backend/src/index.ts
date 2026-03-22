import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { foods, pizzas, starters, desserts } from './foods';
import adminAuth from './adminAuth';
import { getFoodOrderStats, getTableReservations } from './dynamodb';
import heConfig from '../../shared/he.json';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/foods', (_req, res) => {
  res.json( { pizzas, starters, desserts } );
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const fromDate = req.query.from as string | undefined;
    const toDate = req.query.to as string | undefined;
    const stats = await getFoodOrderStats(fromDate, toDate);
    const statsMap = Object.fromEntries(stats.map(s => [s.foodId, s.orderCount]));

    const foodsWithCounts = foods.map(food => ({
      ...food,
      orderCount: statsMap[food.id] || 0,
    }));

    res.json(foodsWithCounts);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/admin/tables', async (_req, res) => {
  try {
    const heTables = (heConfig as { tables: Array<{ id: string; tableNumber: number; chairs: number }> }).tables;
    const reservations = await getTableReservations();
    const resMap = Object.fromEntries(reservations.map(r => [r.tableId, r.occupiedChairs]));

    const tablesWithAvailability = heTables.map(table => ({
      ...table,
      availableChairs: table.chairs - (resMap[table.id] || 0),
    }));

    res.json(tablesWithAvailability);
  } catch (error) {
    console.error('Tables error:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

app.use('/api/admin', adminAuth);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Pizza backend listening on http://localhost:${port}`);
});


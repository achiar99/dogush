import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { foods, dryFood, wetFood, treats, supplements } from './foods';
import { adminRouter } from './admin';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/foods', (_req, res) => {
  res.json({ dryFood, wetFood, treats, supplements });
});

app.use('/api/admin', adminRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = Number(process.env.PORT ?? 5000);
app.listen(port, () => {
  console.log(`Dog Food Store backend listening on http://localhost:${port}`);
});

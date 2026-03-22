import { Router } from 'express';
import { foods } from './foods';

export const adminRouter = Router();

adminRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

adminRouter.get('/foods', (_req, res) => {
  res.json(foods);
});

adminRouter.put('/foods', (req, res) => {
  const updated = req.body;
  const index = foods.findIndex(f => f.id === updated.id);
  if (index !== -1) {
    foods[index] = updated;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

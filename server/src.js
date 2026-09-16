import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import poolsRouter from './routes/pools.js';

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/pools', poolsRouter);
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong on the server' : error.message
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`FairShare API running on port ${port} (in-memory storage)`));
}

export default app;

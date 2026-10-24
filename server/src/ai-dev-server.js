// server/src/ai-dev-server.js - MEMBER 2
// Standalone server so you can build and test the AI module before Member 1's
// backend is ready. Uses sample data by default. Run: npm run dev:ai

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import insightsRouter from './routes/insights.js';

process.env.USE_SAMPLE_DATA ??= 'true';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', insightsRouter);

const port = Number(process.env.AI_PORT) || 5001;
app.listen(port, () => console.log(`AI dev server on http://localhost:${port}`));

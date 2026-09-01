import { appPromise } from '../server.js';

export default async function handler(req: any, res: any) {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    console.error('Vercel API Handler Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

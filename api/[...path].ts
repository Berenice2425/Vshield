import { appPromise } from '../server';

export default async function handler(req: any, res: any) {
  try {
    const app = await appPromise;
    app(req, res);
  } catch (err) {
    console.error("Vercel API Handler Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

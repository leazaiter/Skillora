import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not defined in your environment variables!");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
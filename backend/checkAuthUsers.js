const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres.vescjjkwgkmjhbsgbvvt:New_0909512583@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' });
async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, email FROM auth.users WHERE id = 'f5cdfe50-528c-4bb2-8289-8f7895e49f6c'`);
  console.log('auth.users:', res.rows);
  await client.end();
}
run();

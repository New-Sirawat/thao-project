const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:New_0909512583@db.vescjjkwgkmjhbsgbvvt.supabase.co:5432/postgres' });
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid IN ('qa_questions'::regclass, 'profiles'::regclass, 'leave_requests'::regclass, 'attendances'::regclass)
  `);
  console.log(res.rows);
  await client.end();
}
run();

const { Client } = require('pg');

const client = new Client({
  connectionString: "postgres://postgres.vescjjkwgkmjhbsgbvvt:New_0909512583@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");
    
    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log("Reloaded PostgREST schema cache.");
    
    // Grant permissions just in case
    await client.query("GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role");
    await client.query("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role");
    console.log("Granted permissions.");
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();

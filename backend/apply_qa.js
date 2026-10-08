const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function apply() {
  try {
    await client.connect();
    console.log("Connected to Supabase.");

    const query = `
CREATE TABLE IF NOT EXISTS public."Question" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public."TrainingProgram"(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Reply" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public."Question"(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    `;

    await client.query(query);
    console.log("Q&A Tables created successfully.");
  } catch (err) {
    console.error("Error creating tables", err);
  } finally {
    await client.end();
  }
}

apply();

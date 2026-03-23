# Rene-AI

A personal AI interview assistant that answers questions about my background, experience, and skills -- as me.

Built with Next.js, OpenAI, and Supabase pgvector. The assistant retrieves relevant context from a private knowledge base using RAG (Retrieval-Augmented Generation) and responds in first person, grounded in real experience.

## Live Demo

[https://rene-ai-orcin.vercel.app](https://rene-ai-orcin.vercel.app)

## How It Works

There are two interfaces:

**Public chat** -- Anyone can visit and ask interview-style questions. The assistant answers as me, drawing only from stored memories. No information is saved from public sessions.

**Admin chat** -- A private, password-protected interface where I feed the assistant information about myself conversationally. It classifies what I tell it, extracts clean memory chunks, embeds them, and stores them in a vector database. I can also correct or clarify existing memories the same way -- just by talking to it.

When a question comes in on the public side, the assistant embeds the question, retrieves the most semantically relevant memories, and generates a grounded first-person response. Session history is maintained so follow-up questions work naturally within the same conversation.

## Tech Stack

- **Frontend** -- React, TypeScript, Tailwind CSS
- **Framework** -- Next.js (App Router)
- **LLM + Embeddings** -- OpenAI API (gpt-4o-mini, text-embedding-3-small)
- **Vector Database** -- Supabase pgvector
- **Deployment** -- Vercel

## Features

- RAG pipeline over a self-curated personal knowledge base
- Dual-interface architecture: public read-only chat and private admin chat
- Conversational memory ingestion -- no forms or manual database editing
- Automatic chunking, prefixing, and embedding of new information
- Session-aware public chat with follow-up question support
- Password-protected admin route enforced at the API level

## Running Locally
```bash
git clone https://github.com/yourusername/rene-ai.git
cd rene-ai
npm install
```

Create a `.env.local` file in the project root:
```bash
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_PASSWORD=your_admin_password
```

Set up the Supabase database:
```sql
create extension if not exists vector;

create table memories (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536),
  category text,
  created_at timestamp with time zone default now()
);

create index on memories
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create or replace function match_memories(
  query_embedding text,
  match_threshold float,
  match_count int
)
returns table(
  id uuid,
  content text,
  category text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    category,
    1 - (embedding <=> query_embedding::vector) as similarity
  from memories
  where 1 - (embedding <=> query_embedding::vector) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

Then run:
```bash
npm run dev
```

- `http://localhost:3000` -- public chat
- `http://localhost:3000/admin` -- admin chat
-- Migration: 046-rag-vector-search.sql
-- Description: Add vector similarity search untuk RAG (AI Documents)
-- Created: 2025-01-22

-- Update embedding column dimension dari 1536 ke 768 (Gemini embedding-001)
-- Note: Existing embeddings akan dihapus karena dimension berbeda
ALTER TABLE ai_documents 
ALTER COLUMN embedding TYPE vector(768);

-- Create index untuk vector similarity search
-- Using ivfflat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS ai_documents_embedding_idx 
ON ai_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Note: ivfflat index memerlukan setidaknya beberapa rows untuk bekerja optimal
-- Jika table masih kosong, index akan dibuat tapi mungkin perlu rebuild setelah ada data

-- Create function untuk vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_branch_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  branch_id uuid,
  title text,
  content text,
  document_type ai_document_type,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_documents.id,
    ai_documents.branch_id,
    ai_documents.title,
    ai_documents.content,
    ai_documents.document_type,
    1 - (ai_documents.embedding <=> query_embedding) as similarity,
    ai_documents.metadata
  FROM ai_documents
  WHERE ai_documents.is_active = true
    AND ai_documents.embedding IS NOT NULL
    AND (filter_branch_id IS NULL OR ai_documents.branch_id = filter_branch_id OR ai_documents.branch_id IS NULL)
    AND 1 - (ai_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION match_documents IS 'Vector similarity search untuk AI documents menggunakan cosine distance (Gemini embedding-001, 768 dimensions)';

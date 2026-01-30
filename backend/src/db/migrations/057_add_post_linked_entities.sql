-- Add linked entity fields to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS linked_entity_type VARCHAR(20);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS linked_entity_id INTEGER;

-- Add check constraint for valid entity types
ALTER TABLE posts ADD CONSTRAINT valid_linked_entity_type
  CHECK (linked_entity_type IS NULL OR linked_entity_type IN ('tournament', 'club', 'challenge'));

-- Add index for querying posts by linked entity
CREATE INDEX IF NOT EXISTS idx_posts_linked_entity ON posts(linked_entity_type, linked_entity_id);

COMMENT ON COLUMN posts.linked_entity_type IS 'Type of linked entity: tournament, club, or challenge';
COMMENT ON COLUMN posts.linked_entity_id IS 'ID of the linked entity';

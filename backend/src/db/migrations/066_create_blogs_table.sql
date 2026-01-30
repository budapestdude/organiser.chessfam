-- Migration 066: Create blogs/articles table
-- Allows users to create and publish blog posts

CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,

  -- Metadata
  tags TEXT[], -- Array of tag strings
  read_time_minutes INTEGER, -- Estimated reading time

  -- Publishing
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,

  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- SEO
  slug VARCHAR(300) UNIQUE,
  meta_description TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_tags ON blogs USING GIN(tags);

-- Blog likes tracking
CREATE TABLE IF NOT EXISTS blog_likes (
  id SERIAL PRIMARY KEY,
  blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blog_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_likes_blog ON blog_likes(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user ON blog_likes(user_id);

-- Blog comments
CREATE TABLE IF NOT EXISTS blog_comments (
  id SERIAL PRIMARY KEY,
  blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id INTEGER REFERENCES blog_comments(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_blog ON blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_comment_id);

-- Function to update blog engagement counts
CREATE OR REPLACE FUNCTION update_blog_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'blog_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE blogs SET likes_count = likes_count + 1 WHERE id = NEW.blog_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE blogs SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.blog_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'blog_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE blogs SET comments_count = comments_count + 1 WHERE id = NEW.blog_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE blogs SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.blog_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for engagement counts
CREATE TRIGGER trigger_blog_like_count
AFTER INSERT OR DELETE ON blog_likes
FOR EACH ROW EXECUTE FUNCTION update_blog_engagement_counts();

CREATE TRIGGER trigger_blog_comment_count
AFTER INSERT OR DELETE ON blog_comments
FOR EACH ROW EXECUTE FUNCTION update_blog_engagement_counts();

-- Comments
COMMENT ON TABLE blogs IS 'User-generated blog posts and articles';
COMMENT ON COLUMN blogs.status IS 'draft: not published, published: live, archived: hidden but not deleted';
COMMENT ON COLUMN blogs.slug IS 'URL-friendly version of title for SEO';
COMMENT ON COLUMN blogs.read_time_minutes IS 'Estimated reading time in minutes';
COMMENT ON TABLE blog_likes IS 'Tracks which users liked which blogs';
COMMENT ON TABLE blog_comments IS 'Comments on blog posts, supports threading with parent_comment_id';

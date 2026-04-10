-- Migration: add created_by column to users table for hierarchy tracking
-- Safe to run on existing databases. NULL = self-registered (original admin).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_by INT NULL AFTER role,
  ADD CONSTRAINT fk_users_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Migration: add RBAC roles to users table
-- Run this once against any existing database that was created before RBAC was added.
-- Safe to run multiple times (MODIFY COLUMN is idempotent for ENUM extension).

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'manager', 'chef', 'inventory_staff', 'viewer')
  NOT NULL DEFAULT 'admin';

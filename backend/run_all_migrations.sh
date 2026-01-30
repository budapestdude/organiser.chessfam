#!/bin/bash
set -e

echo "Running all database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set"
    echo "Please set it in your .env file or environment"
    exit 1
fi

# Get the directory of migrations
MIGRATIONS_DIR="src/db/migrations"

# Run each migration in order
for migration in $(ls $MIGRATIONS_DIR/*.sql | sort); do
    echo "Running $(basename $migration)..."
    psql "$DATABASE_URL" -f "$migration"
    
    if [ $? -eq 0 ]; then
        echo "✓ $(basename $migration) completed"
    else
        echo "✗ $(basename $migration) failed"
        exit 1
    fi
done

echo ""
echo "All migrations completed successfully!"

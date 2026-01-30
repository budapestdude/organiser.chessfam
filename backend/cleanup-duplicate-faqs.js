// Cleanup script to remove duplicate FAQs from production database
// Usage: node cleanup-duplicate-faqs.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function cleanupDuplicateFAQs() {
  try {
    await pool.connect();
    console.log('Connected to database');

    // Check current state
    const countBefore = await pool.query('SELECT COUNT(*) FROM faqs');
    console.log(`\nTotal FAQs before cleanup: ${countBefore.rows[0].count}`);

    // Show duplicates
    const duplicates = await pool.query(`
      SELECT question, COUNT(*) as count
      FROM faqs
      GROUP BY question
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (duplicates.rows.length > 0) {
      console.log('\nDuplicate questions found:');
      duplicates.rows.forEach(d => {
        console.log(`  - "${d.question.substring(0, 60)}..." (${d.count} times)`);
      });

      // Delete duplicates, keeping only the one with the lowest ID
      console.log('\nRemoving duplicates (keeping oldest entry for each question)...');
      const deleteResult = await pool.query(`
        DELETE FROM faqs
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM faqs
          GROUP BY question
        )
      `);

      console.log(`Deleted ${deleteResult.rowCount} duplicate FAQs`);
    } else {
      console.log('\nNo duplicates found!');
    }

    // Check final state
    const countAfter = await pool.query('SELECT COUNT(*) FROM faqs');
    console.log(`\nTotal FAQs after cleanup: ${countAfter.rows[0].count}`);

    // Show remaining FAQs
    const remaining = await pool.query(`
      SELECT id, question, category, display_order
      FROM faqs
      ORDER BY display_order, id
    `);

    console.log('\nRemaining FAQs:');
    remaining.rows.forEach(faq => {
      console.log(`  ${faq.display_order}. [${faq.category}] ${faq.question.substring(0, 60)}...`);
    });

    await pool.end();
    console.log('\nCleanup complete!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicateFAQs();

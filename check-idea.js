const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'idea_finder',
  user: 'postgres',
  password: 'Password123!'
});

async function checkLatestIdea() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        scores::text as scores,
        evaluation_details::text as evaluation_details
      FROM ideas
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      const idea = result.rows[0];
      console.log('\n=== Latest Idea ===');
      console.log('Name:', idea.name);
      console.log('\n=== Scores ===');
      const scores = JSON.parse(idea.scores);
      console.log('Number of criteria in scores:', Object.keys(scores).length);
      console.log('Criteria names:', Object.keys(scores).join(', '));

      console.log('\n=== Evaluation Details ===');
      const evalDetails = JSON.parse(idea.evaluation_details);
      console.log('Number of criteria in evaluation:', Object.keys(evalDetails).length);

      // Check each criterion
      for (const [key, detail] of Object.entries(evalDetails)) {
        const hasQuestions = detail.questions && detail.questions.length > 0;
        console.log(`  ${key}: score=${detail.score}, questions=${hasQuestions ? detail.questions.length : 0}`);
      }
    } else {
      console.log('No ideas found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLatestIdea();

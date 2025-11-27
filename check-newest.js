const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkNewest() {
  try {
    const result = await pool.query(`
      SELECT id, name, created_at, action_plan
      FROM ideas
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows[0]) {
      const idea = result.rows[0];
      console.log('\n=== Newest Idea ===');
      console.log('Name:', idea.name);
      console.log('ID:', idea.id);
      console.log('Created:', idea.created_at);
      console.log('\nHas Action Plan:', idea.action_plan !== null);

      if (idea.action_plan) {
        console.log('\n=== Action Plan Structure ===');
        console.log('Has nextSteps:', !!idea.action_plan.nextSteps);
        console.log('Number of steps:', idea.action_plan.nextSteps?.length || 0);
        console.log('Has requiredResources:', !!idea.action_plan.requiredResources);
        console.log('Has timeline:', !!idea.action_plan.timeline);
        console.log('Has criticalPath:', !!idea.action_plan.criticalPath);

        console.log('\n=== Full Action Plan ===');
        console.log(JSON.stringify(idea.action_plan, null, 2));
      } else {
        console.log('\n⚠️  NO ACTION PLAN IN DATABASE');
        console.log('\nThis means the AI did not generate the action plan.');
        console.log('The prompt may not be loading correctly from the YAML file.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkNewest();

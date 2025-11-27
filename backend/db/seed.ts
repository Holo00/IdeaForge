import { pool } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // 1. Seed config data from research-system
    console.log('\n1. Seeding configuration data...');
    await seedConfigData();

    // 2. Seed example ideas from research-system
    console.log('\n2. Seeding example ideas...');
    await seedExampleIdeas();

    console.log('\n✓ Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function seedConfigData() {
  const configDir = path.join(__dirname, '../../research-system/config');

  const configFiles: Record<string, string> = {
    'business-domains.yaml': 'business_domains',
    'problem-types.yaml': 'problem_types',
    'solution-types.yaml': 'solution_types',
    'monetization-models.yaml': 'monetization_models',
    'target-audiences.yaml': 'target_audiences',
    'technologies.yaml': 'technologies',
    'market-sizes.yaml': 'market_sizes',
    'evaluation-criteria.yaml': 'evaluation_criteria',
    'competitive-advantages.yaml': 'competitive_advantages',
    'idea-prompts.yaml': 'idea_prompts',
  };

  for (const [fileName, category] of Object.entries(configFiles)) {
    const filePath = path.join(configDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ Skipping ${fileName} (file not found)`);
      continue;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContent);

    await pool.query(
      `INSERT INTO config (category, data, version)
       VALUES ($1, $2, 1)
       ON CONFLICT (category) DO UPDATE SET data = $2, version = config.version + 1`,
      [category, JSON.stringify(data)]
    );

    console.log(`  ✓ Loaded ${category}`);
  }
}

async function seedExampleIdeas() {
  const ideasDir = path.join(__dirname, '../../research-system/ideas');

  // Read IDEAS-INDEX.yaml to get all ideas
  const indexPath = path.join(ideasDir, 'IDEAS-INDEX.yaml');
  if (!fs.existsSync(indexPath)) {
    console.log('  ⚠ IDEAS-INDEX.yaml not found, skipping example ideas');
    return;
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const indexData: any = yaml.load(indexContent);

  if (!indexData.ideas || indexData.ideas.length === 0) {
    console.log('  ⚠ No ideas found in index');
    return;
  }

  for (const ideaMetadata of indexData.ideas) {
    try {
      // Read the idea.md file
      const ideaPath = path.join(ideasDir, ideaMetadata.folder, 'idea.md');

      if (!fs.existsSync(ideaPath)) {
        console.log(`  ⚠ Skipping ${ideaMetadata.folder} (idea.md not found)`);
        continue;
      }

      const ideaContent = fs.readFileSync(ideaPath, 'utf8');

      // Parse the markdown content (simplified parsing for seed data)
      // In production, you'd want more robust markdown parsing
      const parsed = parseIdeaMarkdown(ideaContent, ideaMetadata);

      await pool.query(
        `INSERT INTO ideas (
          name, folder_name, status, score,
          domain, subdomain, problem, solution,
          scores, quick_summary, concrete_example, evaluation_details,
          tags, generation_framework, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          parsed.name,
          parsed.folderName,
          parsed.status,
          parsed.score,
          parsed.domain,
          parsed.subdomain,
          parsed.problem,
          parsed.solution,
          JSON.stringify(parsed.scores),
          parsed.quickSummary,
          JSON.stringify(parsed.concreteExample),
          JSON.stringify(parsed.evaluationDetails),
          parsed.tags,
          parsed.generationFramework,
          new Date(parsed.created),
        ]
      );

      console.log(`  ✓ Loaded ${parsed.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to load ${ideaMetadata.folder}:`, error);
    }
  }
}

function parseIdeaMarkdown(content: string, metadata: any): any {
  // This is a simplified parser for the seed data
  // Extract key sections from markdown

  const lines = content.split('\n');
  let currentSection = '';
  const sections: Record<string, string> = {};
  let sectionContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection] = sectionContent.join('\n').trim();
      }
      currentSection = line.replace('## ', '').trim();
      sectionContent = [];
    } else if (line.startsWith('# ')) {
      // Title
      sections['title'] = line.replace('# ', '').trim();
    } else {
      sectionContent.push(line);
    }
  }

  if (currentSection && sectionContent.length > 0) {
    sections[currentSection] = sectionContent.join('\n').trim();
  }

  // Extract concrete example
  const concreteExample = {
    currentState: extractSubsection(sections['Concrete Example'] || '', 'Current State') || 'N/A',
    yourSolution: extractSubsection(sections['Concrete Example'] || '', 'Your Solution') || 'N/A',
    keyImprovement: extractSubsection(sections['Concrete Example'] || '', 'Key Improvement') || 'N/A',
  };

  // Extract scores (simplified - would need more robust parsing)
  const scores = {
    problemSeverity: extractScore(sections['Problem Severity'] || ''),
    marketSize: extractScore(sections['Market Size'] || ''),
    competition: extractScore(sections['Competition Level'] || ''),
    monetization: extractScore(sections['Monetization Clarity'] || ''),
    technicalFeasibility: extractScore(sections['Technical Feasibility'] || ''),
    personalInterest: extractScore(sections['Personal Interest'] || ''),
    unfairAdvantage: extractScore(sections['Unfair Advantage'] || ''),
    timeToMarket: extractScore(sections['Time to Market'] || ''),
  };

  // Extract evaluation details
  const evaluationDetails = {
    problemSeverity: extractEvaluation(sections['Problem Severity'] || ''),
    marketSize: extractEvaluation(sections['Market Size'] || ''),
    competition: extractEvaluation(sections['Competition Level'] || ''),
    monetization: extractEvaluation(sections['Monetization Clarity'] || ''),
    technicalFeasibility: extractEvaluation(sections['Technical Feasibility'] || ''),
    personalInterest: extractEvaluation(sections['Personal Interest'] || ''),
    unfairAdvantage: extractEvaluation(sections['Unfair Advantage'] || ''),
    timeToMarket: extractEvaluation(sections['Time to Market'] || ''),
  };

  return {
    name: metadata.name || sections['title'] || 'Untitled Idea',
    folderName: metadata.folder,
    status: metadata.status || 'draft',
    score: metadata.score || 0,
    domain: extractDomain(metadata.domain || ''),
    subdomain: extractSubdomain(metadata.domain || ''),
    problem: metadata.problem || 'Unknown',
    solution: metadata.solution || 'Unknown',
    scores,
    quickSummary: metadata.quick_summary || sections['Quick Summary'] || 'No summary available',
    concreteExample,
    evaluationDetails,
    tags: metadata.tags || [],
    generationFramework: null,
    created: metadata.created || new Date().toISOString(),
  };
}

function extractSubsection(text: string, subsectionName: string): string {
  const regex = new RegExp(`\\*\\*${subsectionName}[^:]*:\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractScore(text: string): number {
  const match = text.match(/Score:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}

function extractEvaluation(text: string): { score: number; reasoning: string } {
  const score = extractScore(text);
  const reasoning = text.replace(/Score:\s*\d+/, '').trim() || 'No reasoning provided';
  return { score, reasoning };
}

function extractDomain(domainString: string): string {
  const parts = domainString.split('→');
  return parts[0]?.trim() || 'Unknown';
}

function extractSubdomain(domainString: string): string | undefined {
  const parts = domainString.split('→');
  return parts[1]?.trim();
}

seedDatabase();

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ValidationError } from '../../lib/errors';
import { pool } from '../../lib/db';

const router = express.Router();

// Path to master config files (single source of truth for filter options)
// __dirname will be in dist/api/routes, so go up to project root then into config
const MASTER_CONFIG_DIR = path.join(__dirname, '../../..', 'config');

/**
 * MASTER CONFIG VALIDATION
 *
 * Master config (/config/) contains ALL possible values for:
 * - business-domains.yaml
 * - monetization-models.yaml
 * - target-audiences.yaml
 * - problem-types.yaml
 * - solution-types.yaml
 *
 * Profile configs can only contain SUBSETS of these values.
 * Filter dropdowns always show master values.
 * Generation uses profile values (validated against master).
 */

// Files that require master validation (profile values must be subset of master)
const MASTER_VALIDATED_FILES = [
  'business-domains.yaml',
  'monetization-models.yaml',
  'target-audiences.yaml',
  'problem-types.yaml',
  'solution-types.yaml',
];

/**
 * Helper to read from master config (always /config/)
 */
async function readMasterYamlFile(filename: string): Promise<any> {
  const filePath = path.join(MASTER_CONFIG_DIR, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Helper to get config directory for a specific profile
 */
async function getConfigDir(profileId?: string): Promise<string> {
  if (!profileId) {
    return MASTER_CONFIG_DIR;
  }

  // Get profile folder name from database
  const result = await pool.query(
    'SELECT folder_name FROM configuration_profiles WHERE id = $1',
    [profileId]
  );

  if (result.rows.length === 0) {
    throw new Error('Configuration profile not found');
  }

  const folderName = result.rows[0].folder_name;

  // Check if this is the default 'config' folder or a custom profile folder
  if (folderName === 'config') {
    return MASTER_CONFIG_DIR;
  }

  // Custom profiles are stored in backend/configs/{folder_name}
  return path.join(__dirname, '../../..', 'configs', folderName);
}

/**
 * Helper to read YAML file
 */
async function readYamlFile(filename: string, profileId?: string): Promise<any> {
  const configDir = await getConfigDir(profileId);
  const filePath = path.join(configDir, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Extract all domain names from domains config (including subdomains)
 */
function extractDomainNames(domainsConfig: any): Set<string> {
  const names = new Set<string>();
  const domains = domainsConfig?.domains || [];
  for (const domain of domains) {
    names.add(domain.name);
    if (domain.subdomains) {
      for (const sub of domain.subdomains) {
        names.add(sub.name);
      }
    }
  }
  return names;
}

/**
 * Extract names from a simple list config (monetization, audiences, problems, solutions)
 */
function extractNames(config: any, key: string): Set<string> {
  const names = new Set<string>();
  const items = config?.[key] || [];
  for (const item of items) {
    if (typeof item === 'string') {
      names.add(item);
    } else if (item.name) {
      names.add(item.name);
    }
  }
  return names;
}

/**
 * Validate profile config against master config
 * Returns array of invalid values (empty if all valid)
 */
async function validateAgainstMaster(
  filename: string,
  profileData: any
): Promise<string[]> {
  const masterData = await readMasterYamlFile(filename);
  const invalidValues: string[] = [];

  switch (filename) {
    case 'business-domains.yaml': {
      const masterNames = extractDomainNames(masterData);
      const profileNames = extractDomainNames(profileData);
      for (const name of profileNames) {
        if (!masterNames.has(name)) {
          invalidValues.push(`Domain/Subdomain "${name}" not in master config`);
        }
      }
      break;
    }
    case 'monetization-models.yaml': {
      const masterNames = extractNames(masterData, 'monetization_models');
      const profileNames = extractNames(profileData, 'monetization_models');
      for (const name of profileNames) {
        if (!masterNames.has(name)) {
          invalidValues.push(`Monetization model "${name}" not in master config`);
        }
      }
      break;
    }
    case 'target-audiences.yaml': {
      const masterNames = extractNames(masterData, 'target_audiences');
      const profileNames = extractNames(profileData, 'target_audiences');
      for (const name of profileNames) {
        if (!masterNames.has(name)) {
          invalidValues.push(`Target audience "${name}" not in master config`);
        }
      }
      break;
    }
    case 'problem-types.yaml': {
      const masterNames = extractNames(masterData, 'problem_types');
      const profileNames = extractNames(profileData, 'problem_types');
      for (const name of profileNames) {
        if (!masterNames.has(name)) {
          invalidValues.push(`Problem type "${name}" not in master config`);
        }
      }
      break;
    }
    case 'solution-types.yaml': {
      const masterNames = extractNames(masterData, 'solution_types');
      const profileNames = extractNames(profileData, 'solution_types');
      for (const name of profileNames) {
        if (!masterNames.has(name)) {
          invalidValues.push(`Solution type "${name}" not in master config`);
        }
      }
      break;
    }
  }

  return invalidValues;
}

/**
 * Helper to write YAML file
 * For master-validated files, validates against master config before writing
 */
async function writeYamlFile(filename: string, data: any, profileId?: string): Promise<void> {
  // If writing to a profile (not master) and file requires validation
  if (profileId && MASTER_VALIDATED_FILES.includes(filename)) {
    const invalidValues = await validateAgainstMaster(filename, data);
    if (invalidValues.length > 0) {
      throw new ValidationError(
        `Profile config contains values not in master config:\n${invalidValues.join('\n')}`
      );
    }
  }

  const configDir = await getConfigDir(profileId);
  const filePath = path.join(configDir, filename);
  const yamlContent = yaml.dump(data, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
  await fs.writeFile(filePath, yamlContent, 'utf-8');
}

/**
 * GET /api/config/frameworks
 * Get all generation frameworks
 */
router.get('/frameworks', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = await readYamlFile('idea-prompts.yaml', profileId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/frameworks
 * Update generation frameworks
 */
router.put('/frameworks', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = req.body;

    // Basic validation
    if (!data.generation_templates || !Array.isArray(data.generation_templates)) {
      throw new ValidationError('Invalid frameworks data: must have generation_templates array');
    }

    await writeYamlFile('idea-prompts.yaml', data, profileId);
    res.json({ success: true, message: 'Frameworks updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @deprecated Use GET /api/config/frameworks instead
 */
router.get('/templates', async (req, res, next) => {
  try {
    const data = await readYamlFile('idea-prompts.yaml');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @deprecated Use PUT /api/config/frameworks instead
 */
router.put('/templates', async (req, res, next) => {
  try {
    const data = req.body;

    if (!data.generation_templates || !Array.isArray(data.generation_templates)) {
      throw new ValidationError('Invalid templates data: must have generation_templates array');
    }

    await writeYamlFile('idea-prompts.yaml', data);
    res.json({ success: true, message: 'Templates updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/domains
 * Get all business domains
 */
router.get('/domains', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = await readYamlFile('business-domains.yaml', profileId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/domains
 * Update business domains
 */
router.put('/domains', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = req.body;

    // Basic validation
    if (!data.domains || !Array.isArray(data.domains)) {
      throw new ValidationError('Invalid domains data: must have domains array');
    }

    await writeYamlFile('business-domains.yaml', data, profileId);
    res.json({ success: true, message: 'Domains updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/criteria
 * Get evaluation criteria
 */
router.get('/criteria', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = await readYamlFile('evaluation-criteria.yaml', profileId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/criteria
 * Update evaluation criteria
 */
router.put('/criteria', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = req.body;

    // Basic validation
    if (!data.criteria || !Array.isArray(data.criteria)) {
      throw new ValidationError('Invalid criteria data: must have criteria array');
    }

    await writeYamlFile('evaluation-criteria.yaml', data, profileId);
    res.json({ success: true, message: 'Criteria updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/settings
 * Get generation settings
 */
router.get('/settings', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = await readYamlFile('generation-settings.yaml', profileId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/settings
 * Update generation settings
 */
router.put('/settings', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = req.body;

    console.log('[Config] Saving settings:', {
      profileId,
      hasExtraFilters: !!data.extraFilters,
      extraFiltersCount: data.extraFilters?.length || 0,
      dataKeys: Object.keys(data)
    });

    await writeYamlFile('generation-settings.yaml', data, profileId);
    console.log('[Config] Settings saved successfully');
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('[Config] Error saving settings:', error);
    next(error);
  }
});

/**
 * GET /api/config/settings/default-prompt
 * Get the default prompt template from promptBuilder
 */
router.get('/settings/default-prompt', async (req, res, next) => {
  try {
    // Import PromptBuilder to get the default template
    const { PromptBuilder } = await import('../../services/promptBuilder');
    const { ConfigService } = await import('../../services/configService');

    // Create instances (we don't actually use configService, just need it for the constructor)
    const configService = new ConfigService();
    const promptBuilder = new PromptBuilder(configService);

    // Access the private method via a workaround - call it with reflection
    const defaultPrompt = (promptBuilder as any).getDefaultPromptTemplate();

    res.json({ default_prompt: defaultPrompt });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/problem-types
 * Get problem types
 */
router.get('/problem-types', async (req, res, next) => {
  try {
    const data = await readYamlFile('problem-types.yaml');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/solution-types
 * Get solution types (from profile or master)
 */
router.get('/solution-types', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = await readYamlFile('solution-types.yaml', profileId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/monetization-models
 * Get monetization models (from profile or master)
 */
router.get('/monetization-models', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = await readYamlFile('monetization-models.yaml', profileId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/monetization-models
 * Update monetization models
 */
router.put('/monetization-models', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = req.body;

    // Basic validation
    if (!data.monetization_models || !Array.isArray(data.monetization_models)) {
      throw new ValidationError('Invalid monetization models data: must have monetization_models array');
    }

    await writeYamlFile('monetization-models.yaml', data, profileId);
    res.json({ success: true, message: 'Monetization models updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/target-audiences
 * Get target audiences (from profile or master)
 */
router.get('/target-audiences', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = await readYamlFile('target-audiences.yaml', profileId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/target-audiences
 * Update target audiences
 */
router.put('/target-audiences', async (req, res, next) => {
  try {
    const profileId = req.query.profileId as string | undefined;
    const data = req.body;

    // Basic validation
    if (!data.target_audiences || !Array.isArray(data.target_audiences)) {
      throw new ValidationError('Invalid target audiences data: must have target_audiences array');
    }

    await writeYamlFile('target-audiences.yaml', data, profileId);
    res.json({ success: true, message: 'Target audiences updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/filters
 * Get ALL filter options from MASTER config (for dropdown population)
 * This always returns the complete set of valid options regardless of active profile
 */
router.get('/filters', async (req, res, next) => {
  try {
    const [domains, monetization, audiences, problems, solutions] = await Promise.all([
      readMasterYamlFile('business-domains.yaml'),
      readMasterYamlFile('monetization-models.yaml'),
      readMasterYamlFile('target-audiences.yaml'),
      readMasterYamlFile('problem-types.yaml'),
      readMasterYamlFile('solution-types.yaml'),
    ]);

    res.json({
      domains: domains?.domains || [],
      monetizationModels: monetization?.monetization_models || [],
      targetAudiences: audiences?.target_audiences || [],
      problemTypes: problems?.problem_types || [],
      solutionTypes: solutions?.solution_types || [],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/api-keys
 * Get all API keys (masked)
 */
router.get('/api-keys', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, provider, model, is_active, created_at, updated_at FROM api_keys ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/api-keys/:id
 * Get a specific API key by ID (masked)
 */
router.get('/api-keys/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, provider, model, is_active, created_at, updated_at FROM api_keys WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/config/api-keys
 * Create a new API key
 */
router.post('/api-keys', async (req, res, next) => {
  try {
    const { name, provider, api_key, model, is_active } = req.body;

    // Validation
    if (!name || !provider || !api_key) {
      throw new ValidationError('Missing required fields: name, provider, api_key');
    }

    if (!['claude', 'openai', 'gemini'].includes(provider)) {
      throw new ValidationError('Invalid provider. Must be: claude, openai, or gemini');
    }

    const result = await pool.query(
      'INSERT INTO api_keys (name, provider, api_key, model, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, provider, model, is_active, created_at, updated_at',
      [name, provider, api_key, model || null, is_active || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/api-keys/:id
 * Update an existing API key
 */
router.put('/api-keys/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, provider, api_key, model, is_active } = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (provider !== undefined) {
      if (!['claude', 'openai', 'gemini'].includes(provider)) {
        throw new ValidationError('Invalid provider. Must be: claude, openai, or gemini');
      }
      updates.push(`provider = $${paramCount++}`);
      values.push(provider);
    }
    if (api_key !== undefined) {
      updates.push(`api_key = $${paramCount++}`);
      values.push(api_key);
    }
    if (model !== undefined) {
      updates.push(`model = $${paramCount++}`);
      values.push(model);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE api_keys SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, name, provider, model, is_active, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/config/api-keys/:id
 * Delete an API key
 */
router.delete('/api-keys/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM api_keys WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/config/api-keys/:id/activate
 * Set an API key as active (and deactivate others of the same provider)
 */
router.post('/api-keys/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get the provider of this key
    const keyResult = await pool.query('SELECT provider FROM api_keys WHERE id = $1', [id]);

    if (keyResult.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const provider = keyResult.rows[0].provider;

    // Deactivate all keys for this provider
    await pool.query('UPDATE api_keys SET is_active = false WHERE provider = $1', [provider]);

    // Activate the selected key
    const result = await pool.query(
      'UPDATE api_keys SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, provider, model, is_active, created_at, updated_at',
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/profiles
 * Get all configuration profiles
 */
router.get('/profiles', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, folder_name, description, is_active, created_at, updated_at FROM configuration_profiles ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/profiles/active
 * Get the currently active configuration profile
 */
router.get('/profiles/active', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, folder_name, description, is_active, created_at, updated_at FROM configuration_profiles WHERE is_active = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active configuration profile found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/config/profiles
 * Create a new configuration profile
 */
router.post('/profiles', async (req, res, next) => {
  try {
    const { name, folder_name, description } = req.body;

    // Validation
    if (!name || !folder_name) {
      throw new ValidationError('Missing required fields: name, folder_name');
    }

    // Validate folder_name format (alphanumeric, dashes, underscores only)
    if (!/^[a-z0-9_-]+$/i.test(folder_name)) {
      throw new ValidationError('folder_name must contain only letters, numbers, dashes, and underscores');
    }

    // Create the configuration directory by copying from config
    const newConfigDir = path.join(__dirname, '../../..', 'configs', folder_name);
    const defaultConfigDir = path.join(__dirname, '../../..', 'configs', 'config');

    try {
      // Check if directory already exists
      await fs.access(newConfigDir);
      throw new ValidationError(`Configuration folder "${folder_name}" already exists`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Copy default config directory to new location
    await fs.cp(defaultConfigDir, newConfigDir, { recursive: true });

    // Insert into database
    const result = await pool.query(
      'INSERT INTO configuration_profiles (name, folder_name, description, is_active) VALUES ($1, $2, $3, false) RETURNING id, name, folder_name, description, is_active, created_at, updated_at',
      [name, folder_name, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/config/profiles/:id/activate
 * Set a configuration profile as active (and deactivate others)
 */
router.post('/profiles/:id/activate', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    console.log('[Config Profile] Activating profile:', id);

    await client.query('BEGIN');

    // Check if profile exists
    const checkResult = await client.query(
      'SELECT id FROM configuration_profiles WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      console.error('[Config Profile] Profile not found:', id);
      return res.status(404).json({ error: 'Configuration profile not found' });
    }

    // Deactivate ALL profiles first (set to false)
    // This works because the constraint allows multiple false values
    await client.query(
      'UPDATE configuration_profiles SET is_active = false, updated_at = CURRENT_TIMESTAMP',
      []
    );
    console.log('[Config Profile] Deactivated all profiles');

    // Then activate the target profile
    await client.query(
      'UPDATE configuration_profiles SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    console.log('[Config Profile] Activated target profile:', id);

    await client.query('COMMIT');

    // Fetch and return the activated profile
    const result = await client.query(
      'SELECT id, name, folder_name, description, is_active, created_at, updated_at FROM configuration_profiles WHERE id = $1',
      [id]
    );

    console.log('[Config Profile] Activated profile:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Config Profile] Error activating profile:', error);
    next(error);
  } finally {
    client.release();
  }
});

/**
 * POST /api/config/profiles/:id/clone
 * Clone an existing configuration profile
 */
router.post('/profiles/:id/clone', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, folder_name } = req.body;

    // Validation
    if (!name || !folder_name) {
      throw new ValidationError('Missing required fields: name, folder_name');
    }

    // Validate folder_name format (alphanumeric, dashes, underscores only)
    if (!/^[a-z0-9_-]+$/i.test(folder_name)) {
      throw new ValidationError('folder_name must contain only letters, numbers, dashes, and underscores');
    }

    // Get the source profile
    const sourceResult = await pool.query(
      'SELECT folder_name FROM configuration_profiles WHERE id = $1',
      [id]
    );

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Source configuration profile not found' });
    }

    const sourceFolderName = sourceResult.rows[0].folder_name;

    // Determine source config directory
    let sourceConfigDir: string;
    if (sourceFolderName === 'config') {
      sourceConfigDir = path.join(__dirname, '../../..', 'configs', 'config');
    } else {
      sourceConfigDir = path.join(__dirname, '../../..', 'configs', sourceFolderName);
    }

    // Create the new configuration directory
    const newConfigDir = path.join(__dirname, '../../..', 'configs', folder_name);

    // Check if new directory already exists
    try {
      await fs.access(newConfigDir);
      throw new ValidationError(`Configuration folder "${folder_name}" already exists`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Copy source config directory to new location
    await fs.cp(sourceConfigDir, newConfigDir, { recursive: true });

    // Insert into database (not active by default)
    const result = await pool.query(
      'INSERT INTO configuration_profiles (name, folder_name, description, is_active) VALUES ($1, $2, $3, false) RETURNING id, name, folder_name, description, is_active, created_at, updated_at',
      [name, folder_name, `Cloned from ${sourceFolderName}`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/config/profiles/:id
 * Delete a configuration profile (cannot delete active profile)
 */
router.delete('/profiles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if profile is active
    const checkResult = await pool.query(
      'SELECT folder_name, is_active FROM configuration_profiles WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration profile not found' });
    }

    if (checkResult.rows[0].is_active) {
      throw new ValidationError('Cannot delete the active configuration profile. Please activate another profile first.');
    }

    const folderName = checkResult.rows[0].folder_name;

    // Delete from database
    await pool.query('DELETE FROM configuration_profiles WHERE id = $1', [id]);

    // Delete the configuration directory
    const configDir = path.join(__dirname, '../../..', 'configs', folderName);
    try {
      await fs.rm(configDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete configuration directory: ${configDir}`, error);
      // Continue even if directory deletion fails
    }

    res.json({ success: true, message: 'Configuration profile deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/ai-models
 * Get all available AI models (for dropdowns/selection)
 * Use ?all=true to get all models including disabled ones (for admin management)
 */
router.get('/ai-models', async (req, res, next) => {
  try {
    const includeAll = req.query.all === 'true';
    const whereClause = includeAll ? '' : 'WHERE is_available = true';
    const result = await pool.query(
      `SELECT id, provider, model_id, display_name, is_available, is_default, description, created_at FROM ai_models ${whereClause} ORDER BY provider, is_default DESC, display_name`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/ai-models/:provider
 * Get available AI models for a specific provider
 */
router.get('/ai-models/:provider', async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await pool.query(
      'SELECT id, provider, model_id, display_name, is_available, is_default, description FROM ai_models WHERE provider = $1 AND is_available = true ORDER BY is_default DESC, display_name',
      [provider]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/config/ai-models
 * Add a new AI model
 */
router.post('/ai-models', async (req, res, next) => {
  try {
    const { provider, model_id, display_name, is_default, description } = req.body;

    // Validation
    if (!provider || !model_id || !display_name) {
      throw new ValidationError('Missing required fields: provider, model_id, display_name');
    }

    if (!['claude', 'openai', 'gemini'].includes(provider)) {
      throw new ValidationError('Invalid provider. Must be: claude, openai, or gemini');
    }

    // If setting this as default, unset other defaults for this provider
    if (is_default) {
      await pool.query(
        'UPDATE ai_models SET is_default = false WHERE provider = $1',
        [provider]
      );
    }

    const result = await pool.query(
      'INSERT INTO ai_models (provider, model_id, display_name, is_default, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, provider, model_id, display_name, is_available, is_default, description',
      [provider, model_id, display_name, is_default || false, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/ai-models/:id
 * Update an AI model
 */
router.put('/ai-models/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { model_id, display_name, is_available, is_default, description } = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (model_id !== undefined) {
      updates.push(`model_id = $${paramCount++}`);
      values.push(model_id);
    }
    if (display_name !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(display_name);
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(is_available);
    }
    if (is_default !== undefined) {
      updates.push(`is_default = $${paramCount++}`);
      values.push(is_default);

      // If setting this as default, unset other defaults for this provider
      if (is_default) {
        const modelResult = await pool.query('SELECT provider FROM ai_models WHERE id = $1', [id]);
        if (modelResult.rows.length > 0) {
          const provider = modelResult.rows[0].provider;
          await pool.query(
            'UPDATE ai_models SET is_default = false WHERE provider = $1 AND id != $2',
            [provider, id]
          );
        }
      }
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE ai_models SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, provider, model_id, display_name, is_available, is_default, description`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/config/ai-models/:id
 * Delete an AI model (soft delete by setting is_available = false)
 */
router.delete('/ai-models/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_available = false
    const result = await pool.query(
      'UPDATE ai_models SET is_available = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    res.json({ success: true, message: 'AI model disabled successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GENERATION SLOTS
// ============================================

/**
 * GET /api/config/generation-slots
 * Get all generation slots with their profile configurations
 */
router.get('/generation-slots', async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        gs.id,
        gs.slot_number,
        gs.profile_id,
        gs.is_enabled,
        gs.created_at,
        gs.updated_at,
        cp.name as profile_name,
        cp.folder_name as profile_folder_name
      FROM generation_slots gs
      LEFT JOIN configuration_profiles cp ON gs.profile_id = cp.id
      ORDER BY gs.slot_number
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config/generation-slots/:slotNumber
 * Get a specific generation slot by slot number
 */
router.get('/generation-slots/:slotNumber', async (req, res, next) => {
  try {
    const { slotNumber } = req.params;
    const result = await pool.query(`
      SELECT
        gs.id,
        gs.slot_number,
        gs.profile_id,
        gs.is_enabled,
        gs.created_at,
        gs.updated_at,
        cp.name as profile_name,
        cp.folder_name as profile_folder_name
      FROM generation_slots gs
      LEFT JOIN configuration_profiles cp ON gs.profile_id = cp.id
      WHERE gs.slot_number = $1
    `, [slotNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Generation slot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config/generation-slots/:slotNumber
 * Update a generation slot's profile assignment
 */
router.put('/generation-slots/:slotNumber', async (req, res, next) => {
  try {
    const { slotNumber } = req.params;
    const { profile_id, is_enabled } = req.body;

    // Build dynamic update
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (profile_id !== undefined) {
      updates.push(`profile_id = $${paramCount++}`);
      values.push(profile_id || null);
    }
    if (is_enabled !== undefined) {
      updates.push(`is_enabled = $${paramCount++}`);
      values.push(is_enabled);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(slotNumber);

    // Use upsert to create slot if it doesn't exist
    await pool.query(`
      INSERT INTO generation_slots (slot_number, profile_id, is_enabled)
      VALUES ($${paramCount}, $1, ${is_enabled !== undefined ? `$${paramCount - 1}` : 'true'})
      ON CONFLICT (slot_number) DO UPDATE SET
        ${updates.join(', ')},
        updated_at = NOW()
      RETURNING id, slot_number, profile_id, is_enabled, created_at, updated_at
    `, values);

    // Fetch with profile info
    const fullResult = await pool.query(`
      SELECT
        gs.id,
        gs.slot_number,
        gs.profile_id,
        gs.is_enabled,
        gs.created_at,
        gs.updated_at,
        cp.name as profile_name,
        cp.folder_name as profile_folder_name
      FROM generation_slots gs
      LEFT JOIN configuration_profiles cp ON gs.profile_id = cp.id
      WHERE gs.slot_number = $1
    `, [slotNumber]);

    res.json(fullResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/config/generation-slots/ensure
 * Ensure slots exist for the given count (creates missing slots with default profile)
 */
router.post('/generation-slots/ensure', async (req, res, next) => {
  try {
    const { count } = req.body;

    if (!count || count < 1 || count > 10) {
      throw new ValidationError('count must be between 1 and 10');
    }

    // Get active profile as default
    const activeProfile = await pool.query(
      'SELECT id FROM configuration_profiles WHERE is_active = true LIMIT 1'
    );
    const defaultProfileId = activeProfile.rows.length > 0 ? activeProfile.rows[0].id : null;

    // Insert missing slots
    for (let i = 1; i <= count; i++) {
      await pool.query(`
        INSERT INTO generation_slots (slot_number, profile_id, is_enabled)
        VALUES ($1, $2, true)
        ON CONFLICT (slot_number) DO NOTHING
      `, [i, defaultProfileId]);
    }

    // Return all slots
    const result = await pool.query(`
      SELECT
        gs.id,
        gs.slot_number,
        gs.profile_id,
        gs.is_enabled,
        gs.created_at,
        gs.updated_at,
        cp.name as profile_name,
        cp.folder_name as profile_folder_name
      FROM generation_slots gs
      LEFT JOIN configuration_profiles cp ON gs.profile_id = cp.id
      WHERE gs.slot_number <= $1
      ORDER BY gs.slot_number
    `, [count]);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;

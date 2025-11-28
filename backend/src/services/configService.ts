import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { pool } from '../lib/db';

// Base path to configs directory
// Use process.cwd() for consistent path resolution in dev and prod
const CONFIGS_BASE_DIR = path.join(process.cwd(), 'backend', 'configs');

// Master config directory (single source of truth for filter options)
// This is the same as the default profile config - /backend/configs/config/
const MASTER_CONFIG_DIR = path.join(CONFIGS_BASE_DIR, 'config');

export class ConfigService {
  // Optional profile override for concurrent generation with different profiles
  private profileIdOverride: string | null = null;

  /**
   * Set a profile override for this service instance
   * Used for concurrent generation with different profiles
   */
  setProfileOverride(profileId: string | null): void {
    this.profileIdOverride = profileId;
  }

  /**
   * Get active configuration profile from database
   */
  private async getActiveConfigProfile(): Promise<{ folder_name: string } | null> {
    try {
      // If profile override is set, use that instead
      if (this.profileIdOverride) {
        const result = await pool.query(
          'SELECT folder_name FROM configuration_profiles WHERE id = $1 LIMIT 1',
          [this.profileIdOverride]
        );
        if (result.rows.length > 0) {
          return result.rows[0];
        }
        console.warn(`Profile override ${this.profileIdOverride} not found, falling back to active`);
      }

      const result = await pool.query(
        'SELECT folder_name FROM configuration_profiles WHERE is_active = true LIMIT 1'
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Failed to fetch active configuration profile:', error);
      return null;
    }
  }

  /**
   * Get config directory for active profile (or override profile)
   */
  private async getConfigDir(): Promise<string> {
    const activeProfile = await this.getActiveConfigProfile();
    if (!activeProfile) {
      // Fall back to default if no active profile found
      console.warn('[ConfigService] No active configuration profile found, using default');
      const fallbackPath = path.join(CONFIGS_BASE_DIR, 'default');
      console.log('[ConfigService] Fallback config path:', fallbackPath);
      return fallbackPath;
    }
    const configPath = path.join(CONFIGS_BASE_DIR, activeProfile.folder_name);
    console.log('[ConfigService] Active profile:', activeProfile.folder_name, 'Path:', configPath);
    return configPath;
  }

  /**
   * Read YAML config file from MASTER config directory
   * Used for filter options that must be consistent across all profiles
   */
  private async readMasterYamlFile(filename: string): Promise<any> {
    const filePath = path.join(MASTER_CONFIG_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.load(content);
  }

  // ============================================
  // MASTER CONFIG METHODS (for filtering/UI)
  // These read from /config/ - the single source of truth
  // ============================================

  /**
   * Get all filter options from master config
   * Used by frontend for filtering ideas across all profiles
   */
  async getMasterFilterOptions(): Promise<{
    domains: any[];
    monetizationModels: any[];
    targetAudiences: any[];
    problemTypes: any[];
    solutionTypes: any[];
  }> {
    const [domains, monetization, audiences, problems, solutions] = await Promise.all([
      this.readMasterYamlFile('business-domains.yaml'),
      this.readMasterYamlFile('monetization-models.yaml'),
      this.readMasterYamlFile('target-audiences.yaml'),
      this.readMasterYamlFile('problem-types.yaml'),
      this.readMasterYamlFile('solution-types.yaml'),
    ]);

    return {
      domains: domains?.domains || [],
      monetizationModels: monetization?.monetization_models || [],
      targetAudiences: audiences?.target_audiences || [],
      problemTypes: problems?.problem_types || [],
      solutionTypes: solutions?.solution_types || [],
    };
  }

  /**
   * Get all domains from master config (for filtering)
   */
  async getMasterDomains(): Promise<any[]> {
    const config = await this.readMasterYamlFile('business-domains.yaml');
    return config?.domains || [];
  }

  /**
   * Get all monetization models from master config (for filtering)
   */
  async getMasterMonetizationModels(): Promise<string[]> {
    const config = await this.readMasterYamlFile('monetization-models.yaml');
    const models = config?.monetization_models || [];
    return models.map((m: any) => m.name || m);
  }

  /**
   * Get all target audiences from master config (for filtering)
   */
  async getMasterTargetAudiences(): Promise<string[]> {
    const config = await this.readMasterYamlFile('target-audiences.yaml');
    const audiences = config?.target_audiences || [];
    return audiences.map((a: any) => a.name || a);
  }

  /**
   * Get all problem types from master config (for filtering)
   */
  async getMasterProblemTypes(): Promise<any[]> {
    const config = await this.readMasterYamlFile('problem-types.yaml');
    return config?.problem_types || [];
  }

  /**
   * Get all solution types from master config (for filtering)
   */
  async getMasterSolutionTypes(): Promise<any[]> {
    const config = await this.readMasterYamlFile('solution-types.yaml');
    return config?.solution_types || [];
  }

  // ============================================
  // PROFILE CONFIG METHODS (for idea generation)
  // These read from /configs/{profile}/ - profile-specific settings
  // ============================================

  /**
   * Read YAML config file from active configuration profile
   */
  private async readYamlFile(filename: string): Promise<any> {
    const configDir = await this.getConfigDir();
    const filePath = path.join(configDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.load(content);
  }

  /**
   * Get configuration by category (reads from YAML files)
   */
  async getConfig(category: string): Promise<any> {
    const fileMap: Record<string, string> = {
      'business_domains': 'business-domains.yaml',
      'problem_types': 'problem-types.yaml',
      'solution_types': 'solution-types.yaml',
      'idea_prompts': 'idea-prompts.yaml',
      'evaluation_criteria': 'evaluation-criteria.yaml',
      'competitive_advantages': 'competitive-advantages.yaml',
    };

    const filename = fileMap[category];
    if (!filename) {
      return null;
    }

    return await this.readYamlFile(filename);
  }

  /**
   * Get all business domains
   */
  async getDomains(): Promise<any> {
    const config = await this.getConfig('business_domains');
    return config?.domains || [];
  }

  /**
   * Get all problem types
   */
  async getProblemTypes(): Promise<any> {
    const config = await this.getConfig('problem_types');
    return config?.problem_types || [];
  }

  /**
   * Get all solution types
   */
  async getSolutionTypes(): Promise<any> {
    const config = await this.getConfig('solution_types');
    return config?.solution_types || [];
  }

  /**
   * Get all idea generation templates
   */
  async getIdeaPrompts(): Promise<any> {
    const config = await this.getConfig('idea_prompts');
    return config;
  }

  /**
   * Get evaluation criteria
   */
  async getEvaluationCriteria(): Promise<any> {
    const config = await this.getConfig('evaluation_criteria');
    return config;
  }

  /**
   * Get competitive advantages framework
   */
  async getCompetitiveAdvantages(): Promise<any> {
    const config = await this.getConfig('competitive_advantages');
    return config?.competitive_advantages || [];
  }

  /**
   * Get generation settings (including prompt template)
   */
  async getGenerationSettings(): Promise<any> {
    return await this.readYamlFile('generation-settings.yaml');
  }

  /**
   * Get all monetization models
   */
  async getMonetizationModels(): Promise<string[]> {
    const config = await this.readYamlFile('monetization-models.yaml');
    const models = config?.monetization_models || [];
    return models.map((m: any) => m.name);
  }

  /**
   * Get all target audiences
   */
  async getTargetAudiences(): Promise<string[]> {
    const config = await this.readYamlFile('target-audiences.yaml');
    const audiences = config?.target_audiences || [];
    return audiences.map((a: any) => a.name);
  }

  /**
   * Get random domain
   */
  async getRandomDomain(): Promise<{ domain: string; subdomain?: string }> {
    const domains = await this.getDomains();
    if (!domains || domains.length === 0) {
      return { domain: 'Technology' };
    }

    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const domain = randomDomain.name;

    // Randomly pick subdomain if available
    let subdomain: string | undefined;
    if (randomDomain.subdomains && randomDomain.subdomains.length > 0) {
      const randomSubdomain =
        randomDomain.subdomains[Math.floor(Math.random() * randomDomain.subdomains.length)];
      subdomain = randomSubdomain.name;
    }

    return { domain, subdomain };
  }

  /**
   * Get multiple random domains
   */
  async getRandomDomains(count: number): Promise<Array<{ domain: string; subdomain?: string }>> {
    const domains = await this.getDomains();
    if (!domains || domains.length === 0) {
      return [{ domain: 'Technology' }];
    }

    // Shuffle domains
    const shuffled = [...domains].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, domains.length));

    const result: Array<{ domain: string; subdomain?: string }> = [];

    // For each selected domain, pick multiple random subdomains
    for (const d of selected) {
      const domain = d.name;

      // If domain has subdomains, pick 3-4 random ones
      if (d.subdomains && d.subdomains.length > 0) {
        const subdomainsToSelect = Math.min(4, d.subdomains.length);
        const shuffledSubdomains = [...d.subdomains].sort(() => Math.random() - 0.5);
        const selectedSubdomains = shuffledSubdomains.slice(0, subdomainsToSelect);

        // Add each subdomain as a separate option
        for (const subdomain of selectedSubdomains) {
          result.push({ domain, subdomain: subdomain.name });
        }
      } else {
        // No subdomains, just add the domain
        result.push({ domain });
      }
    }

    return result;
  }

  /**
   * Get random problem type
   */
  async getRandomProblemType(): Promise<string> {
    const problems = await this.getProblemTypes();
    if (!problems || problems.length === 0) {
      return 'Time Consuming';
    }

    const random = problems[Math.floor(Math.random() * problems.length)];
    return random.name || random;
  }

  /**
   * Get multiple random problem types
   */
  async getRandomProblemTypes(count: number): Promise<string[]> {
    const problems = await this.getProblemTypes();
    if (!problems || problems.length === 0) {
      return ['Time Consuming'];
    }

    // Shuffle and take up to count items
    const shuffled = [...problems].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, problems.length));

    return selected.map((p: any) => p.name || p);
  }

  /**
   * Get random solution type
   */
  async getRandomSolutionType(): Promise<string> {
    const solutions = await this.getSolutionTypes();
    if (!solutions || solutions.length === 0) {
      return 'Automation';
    }

    const random = solutions[Math.floor(Math.random() * solutions.length)];
    return random.name || random;
  }

  /**
   * Get multiple random solution types
   */
  async getRandomSolutionTypes(count: number): Promise<string[]> {
    const solutions = await this.getSolutionTypes();
    if (!solutions || solutions.length === 0) {
      return ['Automation'];
    }

    // Shuffle and take up to count items
    const shuffled = [...solutions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, solutions.length));

    return selected.map((s: any) => s.name || s);
  }

  /**
   * Get random generation framework
   */
  async getRandomFramework(): Promise<any> {
    const prompts = await this.getIdeaPrompts();
    const frameworks = prompts?.generation_templates || [];

    // Filter for enabled frameworks only
    const enabledFrameworks = frameworks.filter((f: any) => f.enabled !== false);

    if (enabledFrameworks.length === 0) {
      throw new Error('No enabled generation frameworks found in configuration');
    }

    return enabledFrameworks[Math.floor(Math.random() * enabledFrameworks.length)];
  }

  /**
   * Get multiple random generation frameworks
   */
  async getRandomFrameworks(count: number): Promise<any[]> {
    const prompts = await this.getIdeaPrompts();
    const frameworks = prompts?.generation_templates || [];

    // Filter for enabled frameworks only
    const enabledFrameworks = frameworks.filter((f: any) => f.enabled !== false);

    if (enabledFrameworks.length === 0) {
      throw new Error('No enabled generation frameworks found in configuration');
    }

    // Shuffle and take up to count items
    const shuffled = [...enabledFrameworks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, enabledFrameworks.length));
  }

  /**
   * Get specific framework by name
   */
  async getFramework(name: string): Promise<any> {
    const prompts = await this.getIdeaPrompts();
    const frameworks = prompts?.generation_templates || [];

    const framework = frameworks.find(
      (f: any) => f.name.toLowerCase() === name.toLowerCase()
    );

    if (!framework) {
      throw new Error(`Framework "${name}" not found`);
    }

    return framework;
  }

  /**
   * @deprecated Use getRandomFramework() instead
   */
  async getRandomTemplate(): Promise<any> {
    return this.getRandomFramework();
  }

  /**
   * @deprecated Use getFramework() instead
   */
  async getTemplate(name: string): Promise<any> {
    return this.getFramework(name);
  }
}

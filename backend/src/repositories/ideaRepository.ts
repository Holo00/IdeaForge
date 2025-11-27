import { query, queryOne } from '../lib/db';
import { Idea, GetIdeasQuery, IdeaHistory, ChangeType } from '../types';
import { NotFoundError } from '../lib/errors';

export class IdeaRepository {
  async create(idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>): Promise<Idea> {
    const result = await query<Idea>(
      `INSERT INTO ideas (
        name, folder_name, status, score,
        domain, subdomain, problem, solution,
        scores, quick_summary, concrete_example, evaluation_details,
        tags, generation_framework, parent_idea_id,
        idea_components, quick_notes, complexity_scores, action_plan, raw_ai_response, ai_prompt,
        monetization_model_id, target_audience_id, estimated_team_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        idea.name,
        idea.folderName,
        idea.status,
        idea.score,
        idea.domain,
        idea.subdomain || null,
        idea.problem,
        idea.solution,
        JSON.stringify(idea.scores),
        idea.quickSummary,
        JSON.stringify(idea.concreteExample),
        JSON.stringify(idea.evaluationDetails),
        idea.tags,
        idea.generationFramework || null,
        idea.parentIdeaId || null,
        (idea as any).ideaComponents ? JSON.stringify((idea as any).ideaComponents) : null,
        (idea as any).quickNotes ? JSON.stringify((idea as any).quickNotes) : null,
        (idea as any).complexityScores ? JSON.stringify((idea as any).complexityScores) : null,
        (idea as any).actionPlan ? JSON.stringify((idea as any).actionPlan) : null,
        (idea as any).rawAiResponse || null,
        (idea as any).aiPrompt || null,
        (idea as any).monetizationModelId || null,
        (idea as any).targetAudienceId || null,
        (idea as any).estimatedTeamSize || null,
      ]
    );

    return this.mapFromDb(result[0]);
  }

  async findById(id: string): Promise<Idea | null> {
    const result = await queryOne<any>(
      'SELECT * FROM ideas WHERE id = $1',
      [id]
    );

    return result ? this.mapFromDb(result) : null;
  }

  async findAll(filters: GetIdeasQuery): Promise<{ ideas: Idea[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause - Basic filters
    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.domain) {
      conditions.push(`domain = $${paramIndex++}`);
      params.push(filters.domain);
    }

    if (filters.subdomain) {
      conditions.push(`subdomain = $${paramIndex++}`);
      params.push(filters.subdomain);
    }

    if (filters.minScore !== undefined) {
      conditions.push(`score >= $${paramIndex++}`);
      params.push(filters.minScore);
    }

    if (filters.maxScore !== undefined) {
      conditions.push(`score <= $${paramIndex++}`);
      params.push(filters.maxScore);
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`tags && $${paramIndex++}`);
      params.push(filters.tags);
    }

    // Advanced filters - Text search
    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR quick_summary ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Advanced filters - Framework
    if (filters.framework) {
      conditions.push(`generation_framework = $${paramIndex++}`);
      params.push(filters.framework);
    }

    // Advanced filters - Monetization (prefer FK column, fallback to JSONB for legacy data)
    if (filters.monetization) {
      conditions.push(`(
        monetization_model_id IN (SELECT id FROM monetization_models WHERE name = $${paramIndex})
        OR idea_components->>'monetizationModel' = $${paramIndex}
      )`);
      params.push(filters.monetization);
      paramIndex++;
    }

    // Advanced filters - Target Audience (prefer FK column, fallback to JSONB for legacy data)
    if (filters.targetAudience) {
      conditions.push(`(
        target_audience_id IN (SELECT id FROM target_audiences WHERE name = $${paramIndex})
        OR idea_components->>'targetAudienceCategory' = $${paramIndex}
      )`);
      params.push(filters.targetAudience);
      paramIndex++;
    }

    if (filters.technology) {
      conditions.push(`idea_components->>'technology' ILIKE $${paramIndex++}`);
      params.push(`%${filters.technology}%`);
    }

    // Advanced filters - Team size (prefer column, fallback to JSONB for legacy data)
    if (filters.maxTeamSize !== undefined) {
      conditions.push(`(
        estimated_team_size <= $${paramIndex}
        OR (estimated_team_size IS NULL AND (idea_components->>'estimatedTeamSize')::int <= $${paramIndex})
      )`);
      params.push(filters.maxTeamSize);
      paramIndex++;
    }

    // Advanced filters - Criteria score filters
    if (filters.minCriteriaScores) {
      for (const [criterion, minValue] of Object.entries(filters.minCriteriaScores)) {
        if (minValue !== undefined && minValue > 0) {
          conditions.push(`(scores->>'${criterion}')::numeric >= $${paramIndex++}`);
          params.push(minValue);
        }
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const sortBy = filters.sortBy || 'created';
    const sortOrder = filters.sortOrder || 'desc';
    const orderByMap: Record<string, string> = {
      score: 'score',
      created: 'created_at',
      updated: 'updated_at',
      name: 'name',
    };
    const orderBy = `ORDER BY ${orderByMap[sortBy]} ${sortOrder.toUpperCase()}`;

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM ideas ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0', 10);

    // Get paginated results
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const ideas = await query<any>(
      `SELECT * FROM ideas ${whereClause} ${orderBy} LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return {
      ideas: ideas.map(this.mapFromDb),
      total,
    };
  }

  async update(id: string, updates: Partial<Idea>): Promise<Idea> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Idea', id);
    }

    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }

    if (updates.scores !== undefined) {
      fields.push(`scores = $${paramIndex++}`);
      params.push(JSON.stringify(updates.scores));
    }

    if (updates.score !== undefined) {
      fields.push(`score = $${paramIndex++}`);
      params.push(updates.score);
    }

    if (updates.evaluationDetails !== undefined) {
      fields.push(`evaluation_details = $${paramIndex++}`);
      params.push(JSON.stringify(updates.evaluationDetails));
    }

    if (updates.concreteExample !== undefined) {
      fields.push(`concrete_example = $${paramIndex++}`);
      params.push(JSON.stringify(updates.concreteExample));
    }

    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`);
      params.push(updates.tags);
    }

    if (fields.length === 0) {
      return existing;
    }

    params.push(id);
    const result = await queryOne<any>(
      `UPDATE ideas SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return this.mapFromDb(result!);
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM ideas WHERE id = $1', [id]);
  }

  async checkDuplicate(domain: string, problem: string, solution: string): Promise<Idea | null> {
    const result = await queryOne<any>(
      `SELECT * FROM ideas
       WHERE domain = $1 AND problem = $2 AND solution = $3
       LIMIT 1`,
      [domain, problem, solution]
    );

    return result ? this.mapFromDb(result) : null;
  }

  async addHistory(
    ideaId: string,
    changeType: ChangeType,
    description: string,
    beforeData?: any,
    afterData?: any
  ): Promise<void> {
    await query(
      `INSERT INTO idea_history (idea_id, change_type, description, before_data, after_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        ideaId,
        changeType,
        description,
        beforeData ? JSON.stringify(beforeData) : null,
        afterData ? JSON.stringify(afterData) : null,
      ]
    );
  }

  async getHistory(ideaId: string): Promise<IdeaHistory[]> {
    const results = await query<any>(
      `SELECT * FROM idea_history WHERE idea_id = $1 ORDER BY created_at DESC`,
      [ideaId]
    );

    return results.map((row) => ({
      id: row.id,
      ideaId: row.idea_id,
      changeType: row.change_type,
      description: row.description,
      beforeData: row.before_data,
      afterData: row.after_data,
      createdAt: row.created_at,
    }));
  }

  private mapFromDb(row: any): Idea {
    return {
      id: row.id,
      name: row.name,
      folderName: row.folder_name,
      status: row.status,
      score: row.score,
      domain: row.domain,
      subdomain: row.subdomain,
      problem: row.problem,
      solution: row.solution,
      scores: row.scores,
      quickSummary: row.quick_summary,
      concreteExample: row.concrete_example,
      evaluationDetails: row.evaluation_details,
      quickNotes: row.quick_notes || undefined,
      complexityScores: row.complexity_scores || undefined,
      actionPlan: row.action_plan || undefined,
      tags: row.tags || [],
      generationFramework: row.generation_framework || undefined,
      ideaComponents: row.idea_components || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      parentIdeaId: row.parent_idea_id || undefined,
      rawAiResponse: row.raw_ai_response || undefined,
      aiPrompt: row.ai_prompt || undefined,
      // New normalized columns
      monetizationModelId: row.monetization_model_id || undefined,
      targetAudienceId: row.target_audience_id || undefined,
      estimatedTeamSize: row.estimated_team_size || undefined,
    } as any;
  }
}

import OpenAI from 'openai';
import { pool } from '../lib/db';

/**
 * Service for generating and comparing embeddings for semantic similarity
 */
export class EmbeddingService {
  private openai: OpenAI | null = null;

  /**
   * Initialize OpenAI client with API key from database
   */
  private async initializeOpenAI(): Promise<void> {
    if (this.openai) return;

    try {
      const result = await pool.query(
        "SELECT api_key FROM api_keys WHERE provider = 'openai' AND is_active = true LIMIT 1"
      );

      if (result.rows.length === 0) {
        throw new Error('No active OpenAI API key found in database');
      }

      this.openai = new OpenAI({
        apiKey: result.rows[0].api_key,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for idea text using OpenAI
   * Combines domain, problem, solution, and summary into single text
   */
  async generateEmbedding(idea: {
    domain: string;
    subdomain?: string;
    problem: string;
    solution: string;
    summary: string;
  }): Promise<number[]> {
    await this.initializeOpenAI();

    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    // Combine all relevant text for embedding
    const combinedText = [
      idea.domain,
      idea.subdomain || '',
      idea.problem,
      idea.solution,
      idea.summary,
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: combinedText,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Find similar ideas using vector similarity search
   * Returns ideas with similarity >= threshold (0.85)
   */
  async findSimilarIdeas(
    embedding: number[],
    threshold: number = 0.85,
    excludeId?: string
  ): Promise<
    Array<{
      id: string;
      name: string;
      domain: string;
      subdomain?: string;
      problem: string;
      solution: string;
      similarity: number;
    }>
  > {
    try {
      // Convert embedding array to vector format for PostgreSQL
      const embeddingString = `[${embedding.join(',')}]`;

      // Query for similar ideas using cosine similarity
      // 1 - (embedding <=> query_embedding) gives similarity score (higher = more similar)
      const query = `
        SELECT
          id,
          name,
          domain,
          subdomain,
          problem,
          solution,
          1 - (embedding <=> $1::vector) as similarity
        FROM ideas
        WHERE embedding IS NOT NULL
          ${excludeId ? 'AND id != $2' : ''}
          AND 1 - (embedding <=> $1::vector) >= $${excludeId ? '3' : '2'}
        ORDER BY embedding <=> $1::vector
        LIMIT 10
      `;

      const params = excludeId
        ? [embeddingString, excludeId, threshold]
        : [embeddingString, threshold];

      const result = await pool.query(query, params);

      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        domain: row.domain,
        subdomain: row.subdomain,
        problem: row.problem,
        solution: row.solution,
        similarity: parseFloat(row.similarity),
      }));
    } catch (error) {
      console.error('Failed to find similar ideas:', error);
      throw error;
    }
  }

  /**
   * Store embedding for an idea in the database
   */
  async storeEmbedding(ideaId: string, embedding: number[]): Promise<void> {
    try {
      const embeddingString = `[${embedding.join(',')}]`;

      await pool.query(
        'UPDATE ideas SET embedding = $1::vector WHERE id = $2',
        [embeddingString, ideaId]
      );
    } catch (error) {
      console.error('Failed to store embedding:', error);
      throw error;
    }
  }

  /**
   * Check if an idea is a duplicate based on semantic similarity
   * Returns the most similar existing idea if similarity >= 0.85
   */
  async checkForDuplicate(idea: {
    domain: string;
    subdomain?: string;
    problem: string;
    solution: string;
    summary: string;
  }): Promise<{
    isDuplicate: boolean;
    similarIdea?: {
      id: string;
      name: string;
      domain: string;
      subdomain?: string;
      problem: string;
      solution: string;
      similarity: number;
    };
  }> {
    try {
      // Generate embedding for the new idea
      const embedding = await this.generateEmbedding(idea);

      // Find similar ideas
      const similarIdeas = await this.findSimilarIdeas(embedding, 0.85);

      if (similarIdeas.length > 0) {
        return {
          isDuplicate: true,
          similarIdea: similarIdeas[0], // Return most similar
        };
      }

      return {
        isDuplicate: false,
      };
    } catch (error) {
      console.error('Failed to check for duplicates:', error);
      // Don't block idea creation if duplicate check fails
      return {
        isDuplicate: false,
      };
    }
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { ExternalServiceError } from './errors';
import { pool } from './db';

dotenv.config();

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface ApiKeyConfig {
  provider: 'claude' | 'gemini';
  apiKey: string;
  model: string;
}

/**
 * Get API key configuration from settings in active configuration profile
 * Falls back to is_active flag if settings.yaml doesn't have api_key_id
 */
async function getApiKeyConfig(): Promise<ApiKeyConfig | null> {
  try {
    // Get active configuration profile's folder name
    const profileResult = await pool.query(
      'SELECT folder_name FROM configuration_profiles WHERE is_active = true LIMIT 1'
    );

    if (profileResult.rows.length === 0) {
      console.error('No active configuration profile found');
      // Fallback: try to get active API key directly
      return await getActiveApiKeyFallback();
    }

    const folderName = profileResult.rows[0].folder_name;

    // Try to get the API key ID from settings.yaml
    const fs = require('fs/promises');
    const path = require('path');
    const yaml = require('js-yaml');

    const configDir = path.join(__dirname, '../..', 'configs', folderName);
    const settingsPath = path.join(configDir, 'settings.yaml');

    let settingsData: any;
    try {
      const settingsContent = await fs.readFile(settingsPath, 'utf-8');
      settingsData = yaml.load(settingsContent);
    } catch (error) {
      console.log('settings.yaml not found, trying fallback method');
      // Fallback: try to get active API key directly
      return await getActiveApiKeyFallback();
    }

    // Get the API key ID from settings
    const apiKeyId = settingsData?.api_key_id;
    if (!apiKeyId) {
      console.log('No api_key_id in settings.yaml, trying fallback method');
      // Fallback: try to get active API key directly
      return await getActiveApiKeyFallback();
    }

    // Get the API key from the database
    const apiKeyResult = await pool.query(
      'SELECT provider, api_key, model FROM api_keys WHERE id = $1',
      [apiKeyId]
    );

    if (apiKeyResult.rows.length === 0) {
      console.error('API key not found in database');
      return await getActiveApiKeyFallback();
    }

    const apiKeyRow = apiKeyResult.rows[0];
    const config = {
      provider: apiKeyRow.provider as 'claude' | 'gemini',
      apiKey: apiKeyRow.api_key,
      model: apiKeyRow.model || (apiKeyRow.provider === 'gemini' ? 'gemini-1.5-pro' : 'claude-sonnet-4-5-20250929')
    };
    console.log(`[API Key Config] Retrieved: provider=${config.provider}, model=${config.model}, key_length=${config.apiKey?.length || 0}`);
    return config;
  } catch (error) {
    console.error('Failed to fetch API key configuration:', error);
    return await getActiveApiKeyFallback();
  }
}

/**
 * Fallback method: Get active API key using is_active flag
 */
async function getActiveApiKeyFallback(): Promise<ApiKeyConfig | null> {
  try {
    const result = await pool.query(
      'SELECT provider, api_key, model FROM api_keys WHERE is_active = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.error('No active API key found');
      return null;
    }

    const apiKeyRow = result.rows[0];
    return {
      provider: apiKeyRow.provider as 'claude' | 'gemini',
      apiKey: apiKeyRow.api_key,
      model: apiKeyRow.model || (apiKeyRow.provider === 'gemini' ? 'gemini-1.5-pro' : 'claude-sonnet-4-5-20250929')
    };
  } catch (error) {
    console.error('Failed to fetch active API key:', error);
    return null;
  }
}

/**
 * Call AI API with a prompt (supports Claude and Gemini)
 */
export async function callAI(
  prompt: string,
  options: AIOptions = {}
): Promise<string> {
  const config = await getApiKeyConfig();

  if (!config) {
    throw new ExternalServiceError(
      'AI Provider',
      'No API key configured. Please add an API key in the Configuration page and select it in Settings.'
    );
  }

  const {
    model = config.model,
    maxTokens = 4096,
    temperature = 1.0,
    systemPrompt,
  } = options;

  if (config.provider === 'claude') {
    return callClaude(config.apiKey, prompt, { model, maxTokens, temperature, systemPrompt });
  } else if (config.provider === 'gemini') {
    return callGemini(config.apiKey, prompt, { model, maxTokens, temperature, systemPrompt });
  } else {
    throw new ExternalServiceError(
      'AI Provider',
      `Unsupported provider: ${config.provider}`
    );
  }
}

/**
 * Call Claude API
 */
async function callClaude(
  apiKey: string,
  prompt: string,
  options: AIOptions
): Promise<string> {
  const anthropic = new Anthropic({ apiKey });

  const {
    model = 'claude-sonnet-4-5-20250929',
    maxTokens = 4096,
    temperature = 1.0,
    systemPrompt,
  } = options;

  try {
    console.log(`[Claude] Calling API with model: ${model}`);

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    });

    // Extract text content from response
    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    return textContent;
  } catch (error: any) {
    console.error(`[Claude] API error with model '${model}':`, error.message || error);

    if (error.status === 401) {
      throw new ExternalServiceError(
        'Claude API',
        'Invalid API key',
        { originalError: error.message }
      );
    }

    if (error.status === 429) {
      throw new ExternalServiceError(
        'Claude API',
        'Rate limit exceeded',
        { originalError: error.message }
      );
    }

    throw new ExternalServiceError(
      'Claude API',
      error.message || 'Unknown error',
      { originalError: error }
    );
  }
}

/**
 * Call Gemini API
 */
async function callGemini(
  apiKey: string,
  prompt: string,
  options: AIOptions
): Promise<string> {
  // Debug: Check if API key is present
  console.log(`[Gemini] API key present: ${!!apiKey}, length: ${apiKey?.length || 0}`);

  if (!apiKey || apiKey.trim() === '') {
    throw new ExternalServiceError(
      'Gemini API',
      'No API key provided. Please check your API key configuration.',
      { model: options.model }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const {
    model = 'gemini-1.5-pro',
    temperature = 1.0,
    systemPrompt,
  } = options;

  try {
    console.log(`[Gemini] Calling API with model: ${model}`);

    const generativeModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: options.maxTokens || 4096,
      },
      systemInstruction: systemPrompt,
    });

    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error: any) {
    console.error(`[Gemini] API error with model '${model}':`, error.message || error);

    // Check for specific Gemini error types
    if (error.message?.includes('API key')) {
      throw new ExternalServiceError(
        'Gemini API',
        'Invalid API key',
        { originalError: error.message, model }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new ExternalServiceError(
        'Gemini API',
        'Rate limit exceeded',
        { originalError: error.message, model }
      );
    }

    // Check for model not found errors
    if (error.message?.includes('not found') || error.message?.includes('not supported')) {
      throw new ExternalServiceError(
        'Gemini API',
        `Model '${model}' is not available. Please update your API key configuration to use a valid model like 'gemini-1.5-pro-latest' or 'gemini-pro'.`,
        { originalError: error.message, model }
      );
    }

    throw new ExternalServiceError(
      'Gemini API',
      error.message || 'Unknown error',
      { originalError: error, model }
    );
  }
}

/**
 * Call AI with conversation history
 */
export async function callAIWithHistory(
  messages: AIMessage[],
  options: AIOptions = {}
): Promise<string> {
  const config = await getApiKeyConfig();

  if (!config) {
    throw new ExternalServiceError(
      'AI Provider',
      'No API key configured. Please add an API key in the Configuration page and select it in Settings.'
    );
  }

  // For now, we'll convert the conversation history to a single prompt
  // In the future, we can implement proper conversation history for both providers
  const combinedPrompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

  return callAI(combinedPrompt, options);
}

/**
 * Check if AI provider is configured
 */
export async function isAIConfigured(): Promise<boolean> {
  const config = await getApiKeyConfig();
  return !!config;
}

/**
 * Legacy exports for backward compatibility
 * Note: callClaude and callGemini are now internal functions
 * Use callAI instead which supports both providers
 */

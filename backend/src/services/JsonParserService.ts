import OpenAI from 'openai';
import logger from '../lib/logger';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export class JsonParserService {
  static removeWebSearchArtifacts(text: string): string {
    let cleaned = text;
    cleaned = cleaned.replace(/\[\d+\]/g, '');
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return cleaned;
  }

  static stripMarkdownJson(text: string): string {
    let cleaned = this.removeWebSearchArtifacts(text);

    const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1].trim();
    }

    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      return cleaned.substring(jsonStart, jsonEnd + 1).trim();
    }

    return cleaned.trim();
  }

  static async parseWithFallback(
    jsonString: string,
    context: string = 'JSON data'
  ): Promise<any> {
    try {
      return JSON.parse(jsonString);
    } catch (parseError: any) {
      const errorPosition = parseError.message.match(/position (\d+)/)?.[1] || 'unknown';
      logger.warn(`JSON parse failed for ${context}: ${parseError.message}`);

      if (!openai) {
        throw new Error(`JSON parse failed and OpenAI not available: ${parseError.message}`);
      }

      try {
        logger.info(`Attempting JSON repair for ${context}`);

        const errorContext = errorPosition !== 'unknown'
          ? `Error around position ${errorPosition}. Context: "${jsonString.substring(Math.max(0, Number(errorPosition) - 100), Math.min(jsonString.length, Number(errorPosition) + 100))}"`
          : '';

        const repairPrompt = `The following JSON is malformed: "${parseError.message}"
${errorContext}

Fix the JSON syntax errors and return ONLY the corrected, valid JSON. No explanations, markdown, or code blocks.

Common issues to fix:
- Trailing commas
- Missing commas
- Unescaped quotes
- Unclosed brackets/braces

Malformed JSON:
${jsonString}

Return the fixed JSON:`;

        const repairResponse = await openai.responses.create({
          model: 'gpt-4.1-mini',
          input: [
            {
              role: 'system',
              content: 'You are a JSON repair expert. Return ONLY valid JSON without markdown, code blocks, or explanations.',
            },
            {
              role: 'user',
              content: repairPrompt,
            },
          ]
        });

        const repairedContent = repairResponse.output_text;
        if (!repairedContent) {
          throw new Error('Empty response from JSON repair attempt');
        }

        const cleanedRepaired = this.stripMarkdownJson(repairedContent);
        const parsed = JSON.parse(cleanedRepaired);

        logger.info(`Successfully repaired JSON for ${context}`);
        return parsed;
      } catch (repairError: any) {
        logger.error({ error: repairError.message }, `JSON repair failed for ${context}`);
        throw new Error(`JSON parse failed: ${parseError.message}. Repair error: ${repairError.message}`);
      }
    }
  }
}

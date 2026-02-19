import Anthropic from '@anthropic-ai/sdk';
import pino from 'pino';
import { ExtractedEvent, ExtractedEventSchema } from './types';
import { config } from './config';

const logger = pino({ name: 'ai-extractor' });

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const SYSTEM_PROMPT = `You are a specialized data extraction AI for Argentine Tango events worldwide.

Your task is to extract structured event information from raw text content of tango event websites.

TANGO-SPECIFIC TERMINOLOGY:
- Milonga: A social dance event where people dance Argentine Tango (most common event type)
- Practica: A practice session, more informal than a milonga, often with teaching moments
- Festival: Multi-day tango event with workshops, milongas, shows, and guest teachers
- Marathon: Multi-day event focused on social dancing, similar to festival but fewer workshops
- Workshop/Taller: A teaching session, usually 1-3 hours, focused on specific techniques
- Class/Clase: Regular recurring tango lessons (weekly or bi-weekly)
- Vals: Waltz style within tango, sometimes separate vals-only events
- Encuentro: A tango meeting/gathering, often by invitation only
- Tandas: Sets of 3-4 songs played at milongas
- Cortina: Short musical interlude between tandas

CLASSIFICATION RULES:
- If it's a regular social dance event → "milonga"
- If it's multi-day with workshops + milongas → "festival"
- If it's a teaching session (single) → "workshop"
- If it's a recurring lesson series → "class"
- If it's an informal practice → "practica"
- Marathons should be classified as "festival"
- Encuentros should be classified as "milonga"

EXTRACTION RULES:
1. Extract ALL events found in the content
2. Convert dates to ISO 8601 format (YYYY-MM-DDTHH:mm:ss±HH:MM)
3. If only a date is given without time, use a reasonable default (milongas typically start at 21:00)
4. If the timezone is unclear, infer from the country/city
5. Extract venue address as completely as possible
6. For recurring events, generate an RRULE string (RFC 5545)
7. Preserve original language in description
8. Translate title to English if in another language
9. Set confidence score based on data completeness (1.0 = all fields clear, 0.5 = some guessing)

IMPORTANT:
- Return ONLY a valid JSON array, no markdown formatting, no extra text
- If no events are found, return []
- Never invent or fabricate event details`;

/**
 * Claude API를 사용하여 웹 페이지 텍스트에서 탱고 이벤트 정보를 추출합니다.
 */
export async function extractEvents(
  pageContent: string,
  sourceUrl: string,
  sourceLanguage?: string,
): Promise<ExtractedEvent[]> {
  logger.info({ sourceUrl, contentLength: pageContent.length }, 'Extracting events with Claude API');

  const userPrompt = buildUserPrompt(pageContent, sourceUrl, sourceLanguage);

  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      logger.warn({ sourceUrl }, 'No text content in Claude response');
      return [];
    }

    const rawJson = textContent.text.trim();
    return parseAndValidateEvents(rawJson, sourceUrl);
  } catch (error) {
    logger.error({ error, sourceUrl }, 'Claude API extraction failed');
    throw error;
  }
}

function buildUserPrompt(content: string, sourceUrl: string, language?: string): string {
  return `Extract all tango events from the following webpage content.

Source URL: ${sourceUrl}
${language ? `Source Language: ${language}` : ''}

---PAGE CONTENT START---
${content}
---PAGE CONTENT END---

Return a JSON array of extracted events. Each event must have at minimum: title, event_type, city, country_code, start_datetime.`;
}

/**
 * Claude의 응답 JSON을 파싱하고 Zod로 검증합니다.
 */
function parseAndValidateEvents(rawJson: string, sourceUrl: string): ExtractedEvent[] {
  // JSON 배열 추출 (마크다운 코드블록 안에 있을 수 있음)
  let jsonStr = rawJson;
  const jsonMatch = rawJson.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    logger.error({ rawJson: rawJson.substring(0, 500), sourceUrl }, 'Failed to parse JSON from Claude');
    return [];
  }

  if (!Array.isArray(parsed)) {
    logger.warn({ sourceUrl }, 'Claude response is not an array');
    return [];
  }

  const validEvents: ExtractedEvent[] = [];

  for (const item of parsed) {
    const result = ExtractedEventSchema.safeParse(item);
    if (result.success) {
      validEvents.push(result.data);
    } else {
      logger.warn(
        { errors: result.error.issues, item, sourceUrl },
        'Event validation failed, skipping',
      );
    }
  }

  logger.info(
    { sourceUrl, total: parsed.length, valid: validEvents.length },
    'Event extraction complete',
  );

  return validEvents;
}

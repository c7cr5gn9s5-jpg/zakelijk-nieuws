import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { AnalyseFout } from './fouten';
import { alsInvoer, controleerVerhalen, DigestSchema, kiesVoorAnalyse, SYSTEEM } from './regels';
import type { Digest, NewsItem } from './types';

// Analyse rechtstreeks vanuit de app, met de eigen API-sleutel van de gebruiker.
// Wie de nachtelijke briefing gebruikt, heeft dit niet nodig.

export const MODEL = 'claude-opus-5-5';
/** Prijs in dollar per miljoen tokens voor MODEL, om de kost van een analyse te schatten. */
const PRIJS = { invoer: 4, uitvoer: 20 };

export async function maakDigest(apiKey: string, alleItems: NewsItem[], profiel: string): Promise<Digest> {
  const items = kiesVoorAnalyse(alleItems);
  if (items.length === 0) throw new AnalyseFout('Er zijn geen recente artikels om te analyseren.');

  // De sleutel is die van de gebruiker zelf en staat alleen op dit toestel.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });

  let antwoord;
  try {
    antwoord = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // Bij een onterechte weigering van het model neemt een ander model het over.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(DigestSchema) },
      system: SYSTEEM,
      messages: [
        {
          role: 'user',
          content:
            `Profiel van de lezer:\n${profiel.trim() || 'Geen profiel opgegeven.'}\n\n` +
            `Het is nu ${new Date().toISOString().slice(0, 16)} UTC. Dit zijn de artikels, één per regel:\n\n` +
            alsInvoer(items),
        },
      ],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new AnalyseFout('Je API-sleutel wordt geweigerd. Controleer hem bij Instellingen.');
    if (e instanceof Anthropic.PermissionDeniedError) throw new AnalyseFout('Je API-sleutel heeft geen toegang tot dit model.');
    if (e instanceof Anthropic.RateLimitError) throw new AnalyseFout('Te veel aanvragen of limiet bereikt. Probeer het later opnieuw.');
    if (e instanceof Anthropic.APIConnectionError) throw new AnalyseFout('Geen verbinding met Claude. Controleer je internet.');
    if (e instanceof Anthropic.APIError) throw new AnalyseFout(`Claude gaf een fout (${e.status ?? '?'}): ${e.message}`);
    // Geen API-fout maar wel van de SDK: het antwoord was geen geldige JSON, meestal omdat het werd afgebroken.
    if (e instanceof Anthropic.AnthropicError) throw new AnalyseFout('Het antwoord van Claude was onvolledig. Probeer het opnieuw.');
    throw e;
  }

  if (antwoord.stop_reason === 'refusal') throw new AnalyseFout('Claude weigerde deze analyse. Probeer het later opnieuw.');
  if (antwoord.stop_reason === 'max_tokens' || !antwoord.parsed_output) {
    throw new AnalyseFout('Het antwoord van Claude was onvolledig. Probeer het opnieuw.');
  }

  const stories = controleerVerhalen(antwoord.parsed_output.verhalen, items);
  if (stories.length === 0) throw new AnalyseFout('Claude vond geen bruikbare verhalen in het huidige nieuws.');

  const gebruikt = new Set(stories.flatMap((s) => s.itemIds));
  const tokensIn = antwoord.usage.input_tokens;
  const tokensUit = antwoord.usage.output_tokens;
  return {
    gemaaktOp: Date.now(),
    model: antwoord.model,
    gebruik: {
      tokensIn,
      tokensUit,
      // Alleen een bedrag tonen als het model met de gekende prijs geantwoord heeft.
      dollar: antwoord.model.startsWith(MODEL) ? (tokensIn * PRIJS.invoer + tokensUit * PRIJS.uitvoer) / 1_000_000 : null,
    },
    stories,
    items: items.filter((i) => gebruikt.has(i.id)),
    gezienIds: items.map((i) => i.id),
  };
}

import type { RenderRequest } from './requests';
import { RendererError, type SpriteRenderer } from './zrenderer-client';

export interface RagassetsClientOptions {
  /** e.g. http://localhost:8080 or https://assets.latam-tools.com.br */
  baseUrl: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/**
 * HTTP client for a ragassets gateway (https://github.com/adsonpleal/ragassets),
 * a Go port of zrenderer that renders from GET query parameters. Action
 * indices and canvas semantics are the same as zrenderer's.
 */
export class RagassetsClient implements SpriteRenderer {
  private readonly fetch: typeof fetch;

  constructor(private readonly options: RagassetsClientOptions) {
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async render(request: RenderRequest): Promise<Uint8Array> {
    const url = new URL('/image', this.options.baseUrl);
    for (const [key, value] of Object.entries(toQuery(request))) url.searchParams.set(key, value);

    let response: Response;
    try {
      response = await this.fetch(url, {
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 15_000),
      });
    } catch (error) {
      throw new RendererError(`Renderer unreachable: ${(error as Error).message}`);
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new RendererError(
        `Renderer responded ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        response.status,
      );
    }
    if (!response.headers.get('content-type')?.startsWith('image/png')) {
      throw new RendererError('Renderer did not return a PNG');
    }
    return new Uint8Array(await response.arrayBuffer());
  }
}

/** Maps a zrenderer request body onto ragassets' /image query parameters. */
export function toQuery(request: RenderRequest): Record<string, string> {
  const query: Record<string, string> = {
    job: request.job.join(','),
    action: String(request.action),
    frame: String(request.frame),
  };
  if (request.gender !== undefined) query.gender = request.gender === 1 ? 'male' : 'female';
  const numbers = [
    'head',
    'garment',
    'weapon',
    'shield',
    'bodyPalette',
    'headPalette',
    'headdir',
    'outputFormat',
  ] as const;
  for (const key of numbers) {
    const value = request[key];
    if (value !== undefined) query[key] = String(value);
  }
  if (request.headgear?.length) query.headgear = request.headgear.join(',');
  if (request.enableShadow !== undefined) query.enableShadow = String(request.enableShadow);
  if (request.canvas) query.canvas = request.canvas;
  return query;
}

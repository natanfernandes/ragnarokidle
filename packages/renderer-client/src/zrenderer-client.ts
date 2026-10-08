import type { RenderRequest } from './requests';

export class RendererError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** Anything that can turn a render request into PNG bytes. */
export interface SpriteRenderer {
  render(request: RenderRequest): Promise<Uint8Array>;
}

export interface ZRendererClientOptions {
  /** e.g. http://localhost:11011 */
  baseUrl: string;
  accessToken: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/** HTTP client for a zrenderer server (https://github.com/zhad3/zrenderer). */
export class ZRendererClient implements SpriteRenderer {
  private readonly fetch: typeof fetch;

  constructor(private readonly options: ZRendererClientOptions) {
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async render(request: RenderRequest): Promise<Uint8Array> {
    const url = new URL('/render', this.options.baseUrl);
    // zrenderer only checks that the parameter is present.
    url.searchParams.set('downloadimage', '');

    let response: Response;
    try {
      response = await this.fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-accesstoken': this.options.accessToken,
        },
        body: JSON.stringify(request),
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
    if (response.status === 204) throw new RendererError('Renderer produced no image', 204);
    if (!response.headers.get('content-type')?.startsWith('image/png')) {
      throw new RendererError('Renderer did not return a PNG');
    }
    return new Uint8Array(await response.arrayBuffer());
  }
}

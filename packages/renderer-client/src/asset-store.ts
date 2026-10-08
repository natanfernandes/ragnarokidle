import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Where rendered sprites are kept so they are rendered only once. */
export interface AssetStore {
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, bytes: Uint8Array): Promise<void>;
}

export class MemoryAssetStore implements AssetStore {
  private readonly assets = new Map<string, Uint8Array>();

  async get(key: string) {
    return this.assets.get(key) ?? null;
  }

  async put(key: string, bytes: Uint8Array) {
    this.assets.set(key, bytes);
  }
}

const SAFE_KEY = /^[A-Za-z0-9_-]+$/;

export class FileAssetStore implements AssetStore {
  constructor(private readonly directory: string) {}

  async get(key: string) {
    try {
      return new Uint8Array(await readFile(this.path(key)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async put(key: string, bytes: Uint8Array) {
    await mkdir(this.directory, { recursive: true });
    // Write then rename so readers never see a half-written file.
    const temp = `${this.path(key)}.${process.pid}.tmp`;
    await writeFile(temp, bytes);
    await rename(temp, this.path(key));
  }

  private path(key: string) {
    if (!SAFE_KEY.test(key)) throw new Error(`Invalid asset key: ${key}`);
    return join(this.directory, `${key}.png`);
  }
}

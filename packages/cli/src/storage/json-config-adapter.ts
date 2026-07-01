import type { ILocalSettings } from '@luminescence/core';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export class JSONConfigAdapter implements ILocalSettings {
  private readonly configDir: string;
  private readonly configFile: string;
  private cache: Record<string, unknown> = {};

  constructor() {
    this.configDir = join(homedir(), '.config', 'luminescence');
    this.configFile = join(this.configDir, 'config.json');
  }

  async get<T>(key: string): Promise<T | null> {
    const config = await this.loadConfig();
    return (config as Record<string, T>)[key] ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const config = await this.loadConfig();
    config[key] = value;
    await this.saveConfig(config);
  }

  async remove(key: string): Promise<void> {
    const config = await this.loadConfig();
    delete config[key];
    await this.saveConfig(config);
  }

  async clear(): Promise<void> {
    this.cache = {};
    await this.saveConfig({});
  }

  private async loadConfig(): Promise<Record<string, unknown>> {
    if (Object.keys(this.cache).length > 0) {
      return this.cache;
    }

    try {
      if (!existsSync(this.configFile)) {
        this.cache = {};
        return this.cache;
      }

      const content = readFileSync(this.configFile, 'utf8');
      this.cache = JSON.parse(content);
      return this.cache;
    } catch {
      this.cache = {};
      return this.cache;
    }
  }

  private async saveConfig(config: Record<string, unknown>): Promise<void> {
    this.cache = config;

    try {
      if (!existsSync(this.configDir)) {
        mkdirSync(this.configDir, { recursive: true });
      }
      writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to save config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

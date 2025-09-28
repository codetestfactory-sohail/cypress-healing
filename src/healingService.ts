/// <reference types="cypress" />

import * as fs from 'fs';
import * as path from 'path';
import { healSelector, HealOptions } from './selectorUtils';

// AI Provider types
export interface AIProvider {
  name: string;
  generateSelector(html: string, context: string): Promise<string | null>;
}

export interface HealingConfig {
  ai: {
    enabled: boolean;
    provider: string;
    providers: {
      [key: string]: {
        apiKey?: string;
        endpoint?: string;
        model?: string;
        temperature?: number;
      };
    };
  };
  heuristics: HealOptions;
  healing: {
    maxAttempts: number;
    timeout: number;
    saveHealed: boolean;
    healedSelectorsFile: string;
    reportFile: string;
    autoHeal: boolean;
  };
}

// Healing result type
export interface HealingResult {
  original: string;
  healed: string | null;
  method: 'heuristic' | 'ai' | 'manual' | 'failed';
  timestamp: number;
}

class HealingService {
  private config: HealingConfig;
  private healedSelectors: Map<string, HealingResult> = new Map();
  private aiProviders: Map<string, AIProvider> = new Map();

  constructor() {
    this.config = this.loadConfig();
    this.loadHealedSelectors();
    this.initializeAIProviders();
  }

  private loadConfig(): HealingConfig {
    const configPath = path.resolve(process.cwd(), 'src/config/healing.config.json');
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
    } catch (error) {
      console.warn('[HealingService] Failed to load config:', error);
    }

    // Return default config
    return {
      ai: {
        enabled: false,
        provider: 'copilot',
        providers: {}
      },
      heuristics: {
        priority: ['data-cy', 'data-testid', 'aria-label', 'role', 'text', 'label', 'class', 'id'],
        excludePatterns: ['^ember-', '^react-', '^ng-', '^[0-9]+$'],
        logging: true
      },
      healing: {
        maxAttempts: 3,
        timeout: 2000,
        saveHealed: true,
        healedSelectorsFile: 'cypress/healed-selectors.json',
        reportFile: 'cypress/healing-report.html',
        autoHeal: true
      }
    };
  }

  private loadHealedSelectors(): void {
    const filePath = this.config.healing.healedSelectorsFile;
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        Object.entries(data).forEach(([key, value]) => {
          this.healedSelectors.set(key, value as HealingResult);
        });
      }
    } catch (error) {
      console.warn('[HealingService] Failed to load healed selectors:', error);
    }
  }

  private saveHealedSelectors(): void {
    if (!this.config.healing.saveHealed) return;

    const filePath = this.config.healing.healedSelectorsFile;
    const dir = path.dirname(filePath);
    
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data: Record<string, HealingResult> = {};
      this.healedSelectors.forEach((value, key) => {
        data[key] = value;
      });

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[HealingService] Failed to save healed selectors:', error);
    }
  }

  private initializeAIProviders(): void {
    // Initialize OpenAI provider
    if (this.config.ai.providers.openai?.apiKey) {
      this.aiProviders.set('openai', {
        name: 'openai',
        generateSelector: async (html: string, context: string) => {
          // This is a placeholder for OpenAI integration
          // In production, you would use the OpenAI API here
          console.log('[AI] OpenAI provider not fully implemented');
          return null;
        }
      });
    }

    // Initialize Google Gemini provider
    if (this.config.ai.providers.gemini?.apiKey) {
      this.aiProviders.set('gemini', {
        name: 'gemini',
        generateSelector: async (html: string, context: string) => {
          // This is a placeholder for Gemini integration
          // In production, you would use the Gemini API here
          console.log('[AI] Gemini provider not fully implemented');
          return null;
        }
      });
    }

    // Initialize Copilot provider (default)
    this.aiProviders.set('copilot', {
      name: 'copilot',
      generateSelector: async (html: string, context: string) => {
        // This is a placeholder for Copilot integration
        // In production, this would integrate with GitHub Copilot API
        console.log('[AI] Copilot provider not fully implemented');
        return null;
      }
    });

    // Initialize Cursor provider
    if (this.config.ai.providers.cursor?.endpoint) {
      this.aiProviders.set('cursor', {
        name: 'cursor',
        generateSelector: async (html: string, context: string) => {
          // Placeholder for Cursor integration
          console.log('[AI] Cursor provider not fully implemented');
          return null;
        }
      });
    }

    // Initialize Warp provider
    if (this.config.ai.providers.warp?.endpoint) {
      this.aiProviders.set('warp', {
        name: 'warp',
        generateSelector: async (html: string, context: string) => {
          // Placeholder for Warp integration
          console.log('[AI] Warp provider not fully implemented');
          return null;
        }
      });
    }
  }

  /**
   * Try to heal a selector using various strategies
   */
  public async heal(
    failingSelector: string,
    dom: Document,
    options: Partial<HealOptions> = {}
  ): Promise<HealingResult> {
    // Check if we have a previously healed selector
    const cached = this.healedSelectors.get(failingSelector);
    if (cached && cached.healed) {
      if (this.config.heuristics.logging) {
        console.log(`[HealingService] Using cached healed selector for ${failingSelector}`);
      }
      return cached;
    }

    let result: HealingResult = {
      original: failingSelector,
      healed: null,
      method: 'failed',
      timestamp: Date.now()
    };

    // Step 1: Try heuristic healing
    if (this.config.healing.autoHeal) {
      const heuristicResult = healSelector(failingSelector, dom, {
        ...this.config.heuristics,
        ...options
      });

      if (heuristicResult) {
        result = {
          original: failingSelector,
          healed: heuristicResult,
          method: 'heuristic',
          timestamp: Date.now()
        };
        
        this.healedSelectors.set(failingSelector, result);
        this.saveHealedSelectors();
        
        if (this.config.heuristics.logging) {
          console.log(`[HealingService] Healed via heuristics: ${failingSelector} → ${heuristicResult}`);
        }
        
        return result;
      }
    }

    // Step 2: Try AI healing if enabled
    if (this.config.ai.enabled && this.aiProviders.has(this.config.ai.provider)) {
      try {
        const provider = this.aiProviders.get(this.config.ai.provider)!;
        const htmlContext = dom.documentElement.outerHTML.substring(0, 5000); // Limit context size
        const aiResult = await provider.generateSelector(htmlContext, failingSelector);

        if (aiResult) {
          result = {
            original: failingSelector,
            healed: aiResult,
            method: 'ai',
            timestamp: Date.now()
          };

          this.healedSelectors.set(failingSelector, result);
          this.saveHealedSelectors();

          if (this.config.heuristics.logging) {
            console.log(`[HealingService] Healed via AI (${provider.name}): ${failingSelector} → ${aiResult}`);
          }

          return result;
        }
      } catch (error) {
        console.error('[HealingService] AI healing failed:', error);
      }
    }

    // Step 3: Check for manual healing entries
    const manualHealingPath = path.resolve(process.cwd(), 'cypress/manual-healing.json');
    try {
      if (fs.existsSync(manualHealingPath)) {
        const manualHealing = JSON.parse(fs.readFileSync(manualHealingPath, 'utf-8'));
        if (manualHealing[failingSelector]) {
          result = {
            original: failingSelector,
            healed: manualHealing[failingSelector],
            method: 'manual',
            timestamp: Date.now()
          };

          this.healedSelectors.set(failingSelector, result);
          this.saveHealedSelectors();

          if (this.config.heuristics.logging) {
            console.log(`[HealingService] Using manual healing: ${failingSelector} → ${manualHealing[failingSelector]}`);
          }

          return result;
        }
      }
    } catch (error) {
      // Manual healing file not found or invalid, continue
    }

    // No healing strategy worked
    if (this.config.heuristics.logging) {
      console.warn(`[HealingService] Failed to heal selector: ${failingSelector}`);
    }

    return result;
  }

  /**
   * Generate a healing report
   */
  public generateReport(): void {
    if (!this.config.healing.saveHealed || this.healedSelectors.size === 0) return;

    const reportPath = this.config.healing.reportFile;
    const dir = path.dirname(reportPath);

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const entries: HealingResult[] = Array.from(this.healedSelectors.values());
      
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cypress Healing Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .stat {
            flex: 1;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #4CAF50;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 500;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
            background: #f5f5f5;
        }
        .method-heuristic { color: #2196F3; font-weight: 500; }
        .method-ai { color: #FF9800; font-weight: 500; }
        .method-manual { color: #9C27B0; font-weight: 500; }
        .method-failed { color: #F44336; font-weight: 500; }
        .selector {
            font-family: 'Courier New', monospace;
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 13px;
        }
        .timestamp {
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🩹 Cypress Healing Report</h1>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${entries.length}</div>
                <div class="stat-label">Total Healed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${entries.filter(e => e.method === 'heuristic').length}</div>
                <div class="stat-label">Heuristic</div>
            </div>
            <div class="stat">
                <div class="stat-value">${entries.filter(e => e.method === 'ai').length}</div>
                <div class="stat-label">AI</div>
            </div>
            <div class="stat">
                <div class="stat-value">${entries.filter(e => e.method === 'manual').length}</div>
                <div class="stat-label">Manual</div>
            </div>
            <div class="stat">
                <div class="stat-value">${entries.filter(e => e.method === 'failed').length}</div>
                <div class="stat-label">Failed</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Original Selector</th>
                    <th>Healed Selector</th>
                    <th>Method</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
                ${entries.map(entry => `
                <tr>
                    <td><span class="selector">${this.escapeHtml(entry.original)}</span></td>
                    <td>${entry.healed ? `<span class="selector">${this.escapeHtml(entry.healed)}</span>` : '-'}</td>
                    <td><span class="method-${entry.method}">${entry.method.toUpperCase()}</span></td>
                    <td><span class="timestamp">${new Date(entry.timestamp).toLocaleString()}</span></td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;

      fs.writeFileSync(reportPath, html);
      console.log(`[HealingService] Report generated at: ${reportPath}`);
    } catch (error) {
      console.error('[HealingService] Failed to generate report:', error);
    }
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Clear all healed selectors
   */
  public clearHealed(): void {
    this.healedSelectors.clear();
    this.saveHealedSelectors();
  }

  /**
   * Get all healed selectors
   */
  public getHealedSelectors(): Map<string, HealingResult> {
    return new Map(this.healedSelectors);
  }
}

// Export singleton instance
export const healingService = new HealingService();
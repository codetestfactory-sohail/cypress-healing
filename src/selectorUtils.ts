/// <reference types="cypress" />

import * as fs from 'fs';
import * as path from 'path';

export type HealOptions = {
  priority?: string[];         // order of heuristics to try
  excludePatterns?: string[];  // regex patterns for unstable IDs/classes
  logging?: boolean;           // log healing actions
  maxTextLength?: number;      // maximum text length for text-based selectors
  minTextLength?: number;      // minimum text length for text-based selectors
};

// Default config - can be overridden by loading from config file
const defaultOptions: HealOptions = {
  priority: ["data-cy", "data-testid", "aria-label", "role", "text", "label", "class", "id"],
  excludePatterns: ["^ember-", "^react-", "^ng-", "^[0-9]+$", "^temp-"],
  logging: true,
  maxTextLength: 50,
  minTextLength: 1,
};

// Load config from file if available
export function loadHeuristicConfig(): HealOptions {
  try {
    const configPath = path.resolve(process.cwd(), 'src/config/healing.config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return { ...defaultOptions, ...config.heuristics };
    }
  } catch (error) {
    console.warn('[Healing] Failed to load config, using defaults:', error);
  }
  return defaultOptions;
}

// --- Heuristic Rules ---

function byDataAttr(root: Document, opts: HealOptions): string | null {
  // Try data-cy first, then data-testid
  const dataCyElement = root.querySelector("[data-cy]");
  if (dataCyElement) {
    const attr = dataCyElement.getAttribute("data-cy");
    if (attr) return `[data-cy="${escapeAttributeValue(attr)}"]`;
  }

  const dataTestIdElement = root.querySelector("[data-testid]");
  if (dataTestIdElement) {
    const attr = dataTestIdElement.getAttribute("data-testid");
    if (attr) return `[data-testid="${escapeAttributeValue(attr)}"]`;
  }

  return null;
}

function byAria(root: Document, opts: HealOptions): string | null {
  const elements = root.querySelectorAll("[aria-label]");
  for (const el of Array.from(elements)) {
    const attr = el.getAttribute("aria-label");
    if (attr && !isExcludedPattern(attr, opts.excludePatterns)) {
      return `[aria-label="${escapeAttributeValue(attr)}"]`;
    }
  }
  return null;
}

function byRole(root: Document, opts: HealOptions): string | null {
  const elements = root.querySelectorAll("[role]");
  for (const el of Array.from(elements)) {
    const attr = el.getAttribute("role");
    if (attr && !isExcludedPattern(attr, opts.excludePatterns)) {
      // For common roles, try to be more specific
      if (attr === "button" || attr === "link") {
        const text = el.textContent?.trim();
        if (text && isValidTextLength(text, opts)) {
          return `[role="${escapeAttributeValue(attr)}"]:contains("${escapeText(text)}")`;
        }
      }
      return `[role="${escapeAttributeValue(attr)}"]`;
    }
  }
  return null;
}

function byLabel(root: Document, opts: HealOptions): string | null {
  const labels = root.querySelectorAll("label[for]");
  for (const label of Array.from(labels)) {
    const forAttr = label.getAttribute("for");
    if (forAttr && !isExcludedPattern(forAttr, opts.excludePatterns)) {
      return `#${escapeCSSSelector(forAttr)}`;
    }
  }
  return null;
}

function byText(root: Document, opts: HealOptions): string | null {
  const textElements = root.querySelectorAll("button, a, span, h1, h2, h3, h4, h5, h6, p, div");
  
  for (const el of Array.from(textElements)) {
    const text = el.textContent?.trim();
    if (text && isValidTextLength(text, opts) && !containsExcludedPattern(text, opts.excludePatterns)) {
      // Prefer exact contains for buttons and links
      if (el.tagName === "BUTTON" || el.tagName === "A") {
        return `${el.tagName.toLowerCase()}:contains("${escapeText(text)}")`;
      }
      // For other elements, use generic contains
      return `:contains("${escapeText(text)}")`;
    }
  }
  return null;
}

function byClass(root: Document, opts: HealOptions): string | null {
  const elements = root.querySelectorAll("[class]");
  
  for (const el of Array.from(elements)) {
    const classes = el.className.split(" ").filter(c => c.length > 0);
    
    // Find a stable class that's not excluded
    const stableClass = classes.find(c => !isExcludedPattern(c, opts.excludePatterns));
    
    if (stableClass) {
      const escapedClass = escapeCSSSelector(stableClass);
      // If it's a unique class, use it directly
      const count = root.querySelectorAll(`.${escapedClass}`).length;
      if (count === 1) {
        return `.${escapedClass}`;
      }
      
      // Otherwise, try to combine with tag name for more specificity
      const tagName = el.tagName.toLowerCase();
      return `${tagName}.${escapedClass}`;
    }
  }
  return null;
}

function byId(root: Document, opts: HealOptions): string | null {
  const elements = root.querySelectorAll("[id]");
  
  for (const el of Array.from(elements)) {
    const id = el.getAttribute("id");
    if (id && !isExcludedPattern(id, opts.excludePatterns)) {
      return `#${escapeCSSSelector(id)}`;
    }
  }
  return null;
}

// --- Helper Functions ---

function isExcludedPattern(value: string, patterns?: string[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some(pattern => new RegExp(pattern).test(value));
}

function containsExcludedPattern(value: string, patterns?: string[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some(pattern => {
    // Use replaceAll or global regex to replace all occurrences
    const cleanPattern = pattern
      .replace(/\^/g, '')  // Remove all ^ anchors
      .replace(/\$/g, '')  // Remove all $ anchors
      .replace(/-/g, '');   // Remove all hyphens
    return value.includes(cleanPattern);
  });
}

function isValidTextLength(text: string, opts: HealOptions): boolean {
  const minLength = opts.minTextLength || 1;
  const maxLength = opts.maxTextLength || 50;
  return text.length >= minLength && text.length <= maxLength;
}

function escapeText(text: string): string {
  // Escape special characters for jQuery :contains() selectors
  // First escape backslashes, then quotes
  return text
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/'/g, "\\'")     // Escape single quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t');   // Escape tabs
}

function escapeCSSSelector(str: string): string {
  // Escape special CSS selector characters
  // Based on CSS.escape() polyfill
  if (!str) return str;
  
  return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

function escapeAttributeValue(value: string): string {
  // Escape attribute values for use in CSS selectors
  if (!value) return value;
  
  // Escape quotes and backslashes
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/"/g, '\\"');   // Escape double quotes
}

// --- Core Healing Function ---

export function healSelector(
  failingSelector: string,
  dom: Document,
  options: Partial<HealOptions> = {}
): string | null {
  const config = loadHeuristicConfig();
  const opts = { ...config, ...options };
  
  const heuristics: Record<string, (root: Document, opts: HealOptions) => string | null> = {
    "data-cy": byDataAttr,
    "data-testid": byDataAttr, // Same function handles both
    "aria-label": byAria,
    "role": byRole,
    "label": byLabel,
    "text": byText,
    "class": byClass,
    "id": byId,
  };

  // Try each heuristic in priority order
  for (const rule of opts.priority || []) {
    const heuristicFn = heuristics[rule];
    if (!heuristicFn) {
      if (opts.logging) {
        console.warn(`[Healing] Unknown heuristic rule: ${rule}`);
      }
      continue;
    }

    try {
      const candidate = heuristicFn(dom, opts);
      if (candidate) {
        // Verify the healed selector actually finds an element
        const verifyElement = dom.querySelector(candidate.startsWith(':contains') ? '*' : candidate);
        if (verifyElement || candidate.includes(':contains')) {
          if (opts.logging) {
            console.log(`[Healed] ${failingSelector} → ${candidate} (using ${rule})`);
          }
          return candidate;
        }
      }
    } catch (error) {
      if (opts.logging) {
        console.warn(`[Healing] Error in ${rule} heuristic:`, error);
      }
    }
  }

  if (opts.logging) {
    console.warn(`[Healing] No healing strategy worked for: ${failingSelector}`);
  }
  
  return null;
}

// --- Multi-selector healing ---

export function healMultipleSelectors(
  selectors: string[],
  dom: Document,
  options: Partial<HealOptions> = {}
): Map<string, string | null> {
  const results = new Map<string, string | null>();
  
  for (const selector of selectors) {
    const healed = healSelector(selector, dom, options);
    results.set(selector, healed);
  }
  
  return results;
}

// --- Smart selector generation ---

export function generateSmartSelector(element: Element, options: Partial<HealOptions> = {}): string | null {
  const config = loadHeuristicConfig();
  const opts = { ...config, ...options };
  
  // Try to generate the best selector for an element
  // Priority: data attributes > aria > role > id > class > text
  
  // Check for data attributes
  const dataCy = element.getAttribute('data-cy');
  if (dataCy) return `[data-cy="${escapeAttributeValue(dataCy)}"]`;
  
  const dataTestId = element.getAttribute('data-testid');
  if (dataTestId) return `[data-testid="${escapeAttributeValue(dataTestId)}"]`;
  
  // Check for aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && !isExcludedPattern(ariaLabel, opts.excludePatterns)) {
    return `[aria-label="${escapeAttributeValue(ariaLabel)}"]`;
  }
  
  // Check for role
  const role = element.getAttribute('role');
  if (role && !isExcludedPattern(role, opts.excludePatterns)) {
    return `[role="${escapeAttributeValue(role)}"]`;
  }
  
  // Check for id
  const id = element.getAttribute('id');
  if (id && !isExcludedPattern(id, opts.excludePatterns)) {
    return `#${escapeCSSSelector(id)}`;
  }
  
  // Check for stable class
  const classes = element.className.split(' ').filter(c => c.length > 0);
  const stableClass = classes.find(c => !isExcludedPattern(c, opts.excludePatterns));
  if (stableClass) {
    return `.${escapeCSSSelector(stableClass)}`;
  }
  
  // Fall back to text content for buttons and links
  if ((element.tagName === 'BUTTON' || element.tagName === 'A') && element.textContent) {
    const text = element.textContent.trim();
    if (isValidTextLength(text, opts)) {
      return `${element.tagName.toLowerCase()}:contains("${escapeText(text)}")`;
    }
  }
  
  return null;
}
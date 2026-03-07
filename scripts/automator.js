'use strict';

/**
 * Natural language parser and intent extractor for OpenClaw task automation.
 * Tokenizes input, matches against known patterns, and extracts parameters.
 */

const INTENT_PATTERNS = [
  {
    intent: 'file_search',
    patterns: [
      /find\s+(?:all\s+)?(?:files?\s+)?(?:with\s+)?(?:extension\s+)?(\.\w+)\s+(?:files?\s+)?(?:in\s+)?(.+)?/i,
      /find\s+(?:all\s+)?(\.\w+)\s+files?\s*(?:in\s+)?(.+)?/i,
      /search\s+(?:for\s+)?(?:all\s+)?(\.\w+)\s+files?\s*(?:in\s+)?(.+)?/i,
      /find\s+(?:all\s+)?(?:files?\s+)?(?:named?\s+)(.+?)(?:\s+in\s+(.+))?$/i,
    ],
    extract: (match) => ({
      extension: match[1],
      directory: (match[2] || '.').trim().replace(/["']/g, ''),
    }),
  },
  {
    intent: 'text_search',
    patterns: [
      /(?:search|grep|look)\s+(?:for\s+)?(?:the\s+)?(?:word|text|string|pattern)?\s*['"](.+?)['"]\s*(?:in\s+)?(.+)?/i,
      /(?:search|grep|look)\s+(?:for\s+)?['"](.+?)['"]\s*(?:in\s+)?(.+)?/i,
      /(?:search|grep|look)\s+(?:for\s+)?(\S+)\s+(?:in\s+)?(.+)?/i,
    ],
    extract: (match) => ({
      pattern: match[1],
      target: (match[2] || '.').trim().replace(/["']/g, ''),
    }),
  },
  {
    intent: 'list_files',
    patterns: [
      /list\s+(?:all\s+)?(?:files?\s+)?(?:in\s+)?(?:the\s+)?(.+?)(?:\s+directory)?$/i,
      /show\s+(?:all\s+)?(?:files?\s+)?(?:in\s+)?(?:the\s+)?(.+?)(?:\s+directory)?$/i,
      /ls\s+(.+)/i,
    ],
    extract: (match) => ({
      directory: (match[1] || '.').trim().replace(/["']/g, ''),
    }),
  },
  {
    intent: 'create_file',
    patterns: [
      /create\s+(?:a\s+)?(?:new\s+)?file\s+(?:named?\s+)?['"]?(.+?)['"]?(?:\s+(?:with|containing)\s+['"](.+?)['"])?$/i,
      /make\s+(?:a\s+)?(?:new\s+)?file\s+(?:named?\s+)?['"]?(.+?)['"]?$/i,
    ],
    extract: (match) => ({
      filename: match[1].trim(),
      content: match[2] || '',
    }),
  },
  {
    intent: 'web_search',
    patterns: [
      /(?:web\s+)?search\s+(?:the\s+)?(?:web|internet)\s+(?:for\s+)?['"]?(.+?)['"]?$/i,
      /(?:search|look\s+up)\s+(?:for\s+)?['"](.+?)['"]/i,
    ],
    extract: (match) => ({
      query: match[1].trim(),
    }),
  },
  {
    intent: 'backup',
    patterns: [
      /backup\s+(.+?)(?:\s+to\s+(.+))?$/i,
      /copy\s+(.+?)\s+to\s+(.+)/i,
    ],
    extract: (match) => ({
      source: match[1].trim().replace(/["']/g, ''),
      destination: (match[2] || './backup').trim().replace(/["']/g, ''),
    }),
  },
  {
    intent: 'cron_setup',
    patterns: [
      /(?:set\s*up|create|schedule)\s+(?:a\s+)?cron\s+(?:job\s+)?(?:that\s+)?(?:runs?\s+)?(.+?)\s+every\s+(.+)/i,
      /(?:run|execute)\s+(.+?)\s+every\s+(.+)/i,
    ],
    extract: (match) => ({
      command: match[1].trim(),
      interval: match[2].trim(),
    }),
  },
];

function tokenize(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s.*'"\/\\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function parseIntent(input) {
  if (!input || typeof input !== 'string') {
    return { intent: 'unknown', raw: input || '', params: {}, confidence: 0 };
  }

  const cleaned = input.trim();
  const tokens = tokenize(cleaned);

  for (const rule of INTENT_PATTERNS) {
    for (const pattern of rule.patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        return {
          intent: rule.intent,
          raw: cleaned,
          params: rule.extract(match),
          tokens,
          confidence: 0.85,
        };
      }
    }
  }

  // Fallback: try to infer from keywords
  if (tokens.some((t) => ['find', 'search', 'locate'].includes(t))) {
    return {
      intent: 'file_search',
      raw: cleaned,
      params: { extension: '*', directory: '.' },
      tokens,
      confidence: 0.4,
    };
  }

  if (tokens.some((t) => ['list', 'show', 'ls', 'dir'].includes(t))) {
    return {
      intent: 'list_files',
      raw: cleaned,
      params: { directory: '.' },
      tokens,
      confidence: 0.4,
    };
  }

  return { intent: 'unknown', raw: cleaned, params: {}, tokens, confidence: 0 };
}

module.exports = { parseIntent, tokenize, INTENT_PATTERNS };

#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
  }
  return results;
}

// Matches: import React from 'react'  OR  import React from "react"
const RE_DEFAULT = /^import React from ['"]react['"][ \t]*;?[ \t]*$/m;

// Matches: import React, { ... } from 'react'  (single or multiline named block)
const RE_WITH_NAMED = /import React,\s*(\{[\s\S]*?\})\s*from ['"]react['"][ \t]*;?/;

const srcDir = path.join(__dirname, '..', 'src');
const files = walk(srcDir);
let changed = 0;

for (const filePath of files) {
  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;

  const hasDefault = RE_DEFAULT.test(content);
  const hasWithNamed = RE_WITH_NAMED.test(content);

  if (!hasDefault && !hasWithNamed) continue;

  // Check if file uses React. namespace anywhere outside of import lines
  const withoutImports = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"][ \t]*;?[ \t]*$/gm, '');
  const usesNamespace = /\bReact\./.test(withoutImports);

  if (hasWithNamed) {
    content = content.replace(RE_WITH_NAMED, (_match, named) => {
      const trimmed = named.trim();
      if (usesNamespace) {
        return `import * as React from 'react';\nimport ${trimmed} from 'react'`;
      }
      return `import ${trimmed} from 'react'`;
    });
  }

  if (RE_DEFAULT.test(content)) {
    if (usesNamespace) {
      content = content.replace(RE_DEFAULT, "import * as React from 'react'");
    } else {
      // Remove the line (and the trailing newline)
      content = content.replace(/^import React from ['"]react['"][ \t]*;?[ \t]*\n?/m, '');
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    changed++;
    const rel = path.relative(srcDir, filePath).replace(/\\/g, '/');
    console.log(`  ✓ ${rel}`);
  }
}

console.log(`\nListo. ${changed} archivos actualizados.`);

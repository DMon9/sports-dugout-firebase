#!/usr/bin/env node

/**
 * Repository Setup Verification Script
 * Checks that all required files for Cloudflare Workers deployment are present
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Cloudflare Workers Setup');
console.log('='.repeat(50));
console.log('');

let allChecksPass = true;

// Files to check
const requiredFiles = [
  {
    path: 'wrangler.toml',
    description: 'Wrangler configuration file',
    critical: true
  },
  {
    path: 'src/worker.js',
    description: 'Worker entry point',
    critical: true
  },
  {
    path: 'package.json',
    description: 'Package configuration',
    critical: true
  },
  {
    path: '.dev.vars.example',
    description: 'Example environment variables',
    critical: false
  },
  {
    path: '.github/workflows/deploy.yml',
    description: 'Production deployment workflow',
    critical: false
  },
  {
    path: '.github/workflows/deploy-dev.yml',
    description: 'Development deployment workflow',
    critical: false
  }
];

// Check each file
console.log('📁 Checking required files:');
console.log('');

for (const file of requiredFiles) {
  const exists = fs.existsSync(file.path);
  const status = exists ? '✅' : (file.critical ? '❌' : '⚠️');
  const label = exists ? 'FOUND' : (file.critical ? 'MISSING (CRITICAL)' : 'MISSING (OPTIONAL)');
  
  console.log(`${status} ${file.path}`);
  console.log(`   ${file.description} - ${label}`);
  
  if (!exists && file.critical) {
    allChecksPass = false;
  }
  
  console.log('');
}

// Check wrangler.toml content
if (fs.existsSync('wrangler.toml')) {
  console.log('📄 Checking wrangler.toml content:');
  console.log('');
  
  const wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
  
  const checks = [
    { 
      test: wranglerContent.includes('name = "sports-dugout-firebase"'),
      label: 'Application name configured',
      fix: 'Add: name = "sports-dugout-firebase"'
    },
    {
      test: wranglerContent.includes('main = "src/worker.js"'),
      label: 'Entry point configured',
      fix: 'Add: main = "src/worker.js"'
    },
    {
      test: wranglerContent.includes('nodejs_compat'),
      label: 'Node.js compatibility enabled',
      fix: 'Add: compatibility_flags = ["nodejs_compat"]'
    },
    {
      test: wranglerContent.includes('[env.development]'),
      label: 'Development environment configured',
      fix: 'Add [env.development] section'
    },
    {
      test: wranglerContent.includes('[env.production]'),
      label: 'Production environment configured',
      fix: 'Add [env.production] section'
    }
  ];
  
  for (const check of checks) {
    const status = check.test ? '✅' : '❌';
    console.log(`${status} ${check.label}`);
    if (!check.test) {
      console.log(`   Fix: ${check.fix}`);
      allChecksPass = false;
    }
  }
  
  console.log('');
}

// Check if wrangler.toml is in .gitignore
console.log('🔒 Checking .gitignore:');
console.log('');

if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  const isIgnored = gitignoreContent.split('\n').some(line => {
    const trimmed = line.trim();
    return trimmed === 'wrangler.toml' || trimmed === 'wrangler.*';
  });
  
  if (isIgnored) {
    console.log('❌ wrangler.toml is in .gitignore (should not be)');
    console.log('   Fix: Remove wrangler.toml from .gitignore');
    allChecksPass = false;
  } else {
    console.log('✅ wrangler.toml is not ignored');
  }
} else {
  console.log('⚠️  No .gitignore file found');
}

console.log('');

// Check package.json scripts
console.log('📦 Checking package.json scripts:');
console.log('');

if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const expectedScripts = [
    { name: 'dev', expected: 'wrangler dev' },
    { name: 'deploy', expected: 'wrangler deploy' },
    { name: 'deploy:production', expected: 'wrangler deploy --env production' },
    { name: 'deploy:development', expected: 'wrangler deploy --env development' }
  ];
  
  for (const script of expectedScripts) {
    if (scripts[script.name]) {
      console.log(`✅ "${script.name}" script configured`);
    } else {
      console.log(`❌ "${script.name}" script missing`);
      console.log(`   Add: "${script.name}": "${script.expected}"`);
      allChecksPass = false;
    }
  }
  
  // Check for wrangler dependency
  console.log('');
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  if (deps.wrangler) {
    console.log(`✅ Wrangler installed (version ${deps.wrangler})`);
  } else {
    console.log('❌ Wrangler not installed');
    console.log('   Run: npm install --save-dev wrangler');
    allChecksPass = false;
  }
}

console.log('');
console.log('='.repeat(50));

if (allChecksPass) {
  console.log('✅ All checks passed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Set up environment variables (see .dev.vars.example)');
  console.log('2. Test locally: npm run dev');
  console.log('3. Deploy: npm run deploy:production');
  console.log('');
  console.log('For CI/CD deployment:');
  console.log('- Add CLOUDFLARE_API_TOKEN to GitHub secrets');
  console.log('- Add CLOUDFLARE_ACCOUNT_ID to GitHub secrets');
  console.log('- See .github/workflows/README.md for details');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('');
  console.log('For help, see:');
  console.log('- CLOUDFLARE-DEPLOYMENT.md');
  console.log('- .github/workflows/README.md');
  process.exit(1);
}

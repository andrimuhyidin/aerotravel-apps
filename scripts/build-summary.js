/**
 * Build Summary - Displays comprehensive build info before starting
 * Shows stages, estimated times, system info, and tips
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

// Try to load package.json for version info
let packageJson = { version: '1.0.0' };
try {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
} catch {
  // Use default
}

// Build stages with estimated times
const stages = [
  { num: 1, name: 'Environment Check', time: '~5s', desc: 'Verify env variables' },
  { num: 2, name: 'TypeScript Compile', time: '~30s', desc: 'Type checking all files' },
  { num: 3, name: 'Webpack Bundle', time: '~2-3m', desc: 'Compile client & server' },
  { num: 4, name: 'Static Generation', time: '~4-6m', desc: 'Pre-render ~900 pages' },
  { num: 5, name: 'API Routes Build', time: '~30s', desc: 'Build serverless functions' },
  { num: 6, name: 'Optimization', time: '~1m', desc: 'Minify, compress, optimize' },
  { num: 7, name: 'Upload (Vercel)', time: '~30s', desc: 'Deploy to edge network' },
];

// Project info
const projectInfo = {
  name: 'MyAeroTravel ID',
  version: packageJson.version || '1.0.0',
  framework: 'Next.js 15.5.9',
  nodeRequired: '>=20.19.0',
  pages: '~914 pages',
  apiRoutes: '~120 endpoints',
  locales: 'id, en',
};

// System info
const systemInfo = {
  platform: os.platform() + ' ' + os.arch(),
  nodeVersion: process.version,
  cpuCores: os.cpus().length,
  memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
};

// Vercel limits
const vercelLimits = {
  hobby: { buildTimeout: '45 min', functionTimeout: '10s', concurrent: '1' },
  pro: { buildTimeout: '45 min', functionTimeout: '60s', concurrent: '12' },
};

// Detect plan from environment
const isVercel = process.env.VERCEL === '1';
const plan = process.env.VERCEL_ENV === 'production' ? 'pro' : 'hobby';
const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

// Helper functions
const line = (len = 68) => '='.repeat(len);
const dash = (len = 66) => '-'.repeat(len);

// Print build summary
console.log('');
console.log('+' + line() + '+');
console.log('|' + '  BUILD SUMMARY'.padStart(42).padEnd(68) + '|');
console.log('+' + line() + '+');

// Project Info Section
console.log('|  PROJECT INFO' + ' '.repeat(53) + '|');
console.log('|     Name: ' + projectInfo.name.padEnd(55) + '|');
console.log('|     Version: ' + projectInfo.version.padEnd(52) + '|');
console.log('|     Framework: ' + projectInfo.framework.padEnd(50) + '|');
console.log('|     Pages: ' + projectInfo.pages.padEnd(54) + '|');
console.log('|     API Routes: ' + projectInfo.apiRoutes.padEnd(49) + '|');
console.log('|     Locales: ' + projectInfo.locales.padEnd(52) + '|');
console.log('+' + line() + '+');

// System Info Section
console.log('|  SYSTEM INFO' + ' '.repeat(54) + '|');
console.log('|     Platform: ' + systemInfo.platform.padEnd(51) + '|');
console.log('|     Node.js: ' + systemInfo.nodeVersion.padEnd(52) + '|');
console.log('|     CPU Cores: ' + String(systemInfo.cpuCores).padEnd(50) + '|');
console.log('|     Memory: ' + systemInfo.memory.padEnd(53) + '|');
console.log('+' + line() + '+');

// Environment Section
console.log('|  ENVIRONMENT' + ' '.repeat(54) + '|');
console.log('|     Environment: ' + env.padEnd(48) + '|');
console.log('|     Running on Vercel: ' + (isVercel ? 'Yes' : 'No').padEnd(43) + '|');
if (isVercel) {
  console.log('|     Plan: ' + plan.toUpperCase().padEnd(55) + '|');
  console.log('|     Build Timeout: ' + vercelLimits[plan].buildTimeout.padEnd(46) + '|');
  console.log('|     Function Timeout: ' + vercelLimits[plan].functionTimeout.padEnd(43) + '|');
  console.log('|     Concurrent Builds: ' + vercelLimits[plan].concurrent.padEnd(42) + '|');
}
console.log('+' + line() + '+');

// Build Stages Section
console.log('|  BUILD STAGES' + ' '.repeat(53) + '|');
console.log('|  ' + dash() + '|');
console.log('|  ' + '#'.padEnd(4) + 'Stage'.padEnd(22) + 'Est.Time'.padEnd(12) + 'Description'.padEnd(28) + '|');
console.log('|  ' + dash() + '|');

stages.forEach((s) => {
  const num = String(s.num).padEnd(4);
  const name = s.name.padEnd(22);
  const time = s.time.padEnd(12);
  const desc = s.desc.padEnd(28);
  console.log('|  ' + num + name + time + desc + '|');
});

console.log('|  ' + dash() + '|');
console.log('+' + line() + '+');

// Total Estimate
console.log('|  TOTAL ESTIMATED TIME: 8-12 minutes' + ' '.repeat(30) + '|');
console.log('+' + line() + '+');

// Tips Section
console.log('|  TIPS' + ' '.repeat(61) + '|');
console.log('|     - Watch "Generating static pages (X/914)" for progress' + ' '.repeat(7) + '|');
console.log('|     - Warnings are normal, only errors block deployment' + ' '.repeat(10) + '|');
console.log('|     - First build is slower, subsequent builds use cache' + ' '.repeat(9) + '|');
console.log('|     - Check Vercel Dashboard for real-time build logs' + ' '.repeat(12) + '|');
console.log('+' + line() + '+');

console.log('');
console.log('Starting build process...');
console.log('-'.repeat(70));
console.log('');

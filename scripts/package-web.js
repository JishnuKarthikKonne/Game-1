/**
 * PARADOX - Web Distribution Packager
 * Packages the production dist/ bundle into release/web/PARADOX-web-v1.0.0.zip
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const releaseWebDir = path.resolve('release/web');
if (!fs.existsSync(releaseWebDir)) {
  fs.mkdirSync(releaseWebDir, { recursive: true });
}

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
  console.log('Building web production bundle first...');
  execSync('npm run build', { stdio: 'inherit' });
}

const zipPath = path.join(releaseWebDir, 'PARADOX-web-v1.0.0.zip');
try {
  // Use zip if available, or Node archiver fallback
  execSync(`cd dist && zip -r "${zipPath}" .`, { stdio: 'inherit' });
  console.log(`Successfully packaged web distribution: ${zipPath}`);
} catch (err) {
  console.warn('System zip utility not found, copying dist directory directly to release/web/dist');
  fs.cpSync(distDir, path.join(releaseWebDir, 'dist'), { recursive: true });
}

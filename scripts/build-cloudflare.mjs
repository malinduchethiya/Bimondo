import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiDir = path.join(root, 'app', 'api');
const backupDir = path.join(root, '.cf-api-backup');
const nextTypesDir = path.join(root, '.next', 'types');
const outDir = path.join(root, 'out');

// Recover if a previous interrupted build left .cf-api-backup behind
if (!fs.existsSync(apiDir) && fs.existsSync(backupDir)) {
  fs.renameSync(backupDir, apiDir);
}

const hadApiDir = fs.existsSync(apiDir);
if (hadApiDir) {
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
  fs.renameSync(apiDir, backupDir);
}

try {
  // Ensure clean static export output without stale server route type references
  if (fs.existsSync(nextTypesDir)) {
    fs.rmSync(nextTypesDir, { recursive: true, force: true });
  }
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_OUTPUT_EXPORT: '1',
    },
  });
} finally {
  if (hadApiDir && fs.existsSync(backupDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.renameSync(backupDir, apiDir);
  }
}

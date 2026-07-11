import { rmSync } from 'node:fs';

export default function globalTeardown() {
  const databasePath = process.env.PLAYWRIGHT_DB_PATH;
  if (!databasePath) {
    return;
  }

  for (const path of [databasePath, `${databasePath}-shm`, `${databasePath}-wal`]) {
    rmSync(path, { force: true });
  }
}

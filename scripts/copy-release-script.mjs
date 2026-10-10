import { copyFileSync } from 'node:fs';
copyFileSync(new URL('../infrastructure/activate-release.sh',import.meta.url),new URL('../dist/activate-release.sh',import.meta.url));

import {copyFileSync} from 'node:fs';
for(const name of ['cards','metadata'])copyFileSync(new URL(`../../backend/src/data/${name}.json`,import.meta.url),new URL(`../static/data/${name}.json`,import.meta.url));

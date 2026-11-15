// builds the static art into ../assets. run: node art/build.mjs
// (assets/voyage.svg is separate: art/voyage.mjs, refreshed daily by the workflow)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hero } from './hero.mjs';
import { cart, PROJECTS } from './carts.mjs';
import { inventory, footer, header } from './extras.mjs';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(out, { recursive: true });
const files = {
  'hero.svg': hero(),
  'inventory.svg': inventory(),
  'footer.svg': footer(),
  'h-carts.svg': header('SELECT A CARTRIDGE', 'THINGS I SHIPPED'),
};
PROJECTS.forEach((p, i) => (files[p.file] = cart(p, i)));
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(out, name), content);
  console.log(name, (content.length / 1024).toFixed(1) + 'kb');
}

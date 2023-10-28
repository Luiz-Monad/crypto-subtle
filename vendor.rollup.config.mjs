import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import multi from '@rollup/plugin-multi-entry';

import path from 'path';
import Glob from 'glob';

const glob = (patt) => (cwd) => Glob.sync(patt, { cwd });

const vendored = {
  sjcl: ['./vendor/sjcl', glob('*')],
  forge: ['./vendor/forge', 'index.js'],
  rsa: ['./vendor/rsa', 'rsa.js'],
  keypairs: ['./vendor/keypairs', 'keypairs.js'],
  rasha: ['./vendor/rasha', 'rasha.js'],
  eckles: ['./vendor/eckles', 'eckles.js'],
  buffer: ['./vendor/buffer', 'index.js'],
}

const entrypoint = (root, input) =>
  (typeof input === 'string' ? [input] : Array.from(input(root)))
    .map(i => path.join(root, i));

const config = Object.entries(vendored).map(([libName, [root, input, plugins = []]]) => ({
  input: entrypoint(root, input),
  plugins: [
    ...plugins,
    babel({
      configFile: './vendor.babelrc',
      babelHelpers: 'external',
      skipPreflightCheck: true,
    }),
    resolve({
      rootDir: root,
      moduleDirectories: [
        path.resolve(root),
      ],
    }),
    commonjs({
      preserveModules: true,
    }),
    multi({
      entryFileName: 'index.js',
      exports: true,
      preserveModules: true,
    }),
  ],
  external: [
    /* browser */
    'crypto',

    /* node */
    'buffer',
    'os',

    /* vendor */
    'node-forge',
    'keypairs',
    'rasha',
    'eckles',
  ],
  output: {
    dir: `dist/vendor/${libName}`,
    format: 'es',
    preserveModules: true,
    minifyInternalExports: false,
  },
}));

export default config;

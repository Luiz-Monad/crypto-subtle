import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import multi from '@rollup/plugin-multi-entry';

import path from 'path';
import Glob from 'glob';

const glob = (patt) => (cwd) => Glob.sync(patt, { cwd });

const vendored = {
  sjcl: ['./vendor-cjs/sjcl', glob('*')],
  forge: ['./vendor-cjs/forge', 'index.js'],
  rsa: ['./vendor-cjs/rsa', 'rsa.js'],
  keypairs: ['./vendor-cjs/keypairs', 'keypairs.js'],
  rasha: ['./vendor-cjs/rasha', 'rasha.js'],
  eckles: ['./vendor-cjs/eckles', 'eckles.js'],
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
    'buffer-v6-polyfill',
    'os',

    /* vendor */
    'node-forge',
    'keypairs',
    'rasha',
    'eckles',
  ],
  output: {
    dir: `vendor/${libName}`,
    format: 'es',
    preserveModules: true,
    minifyInternalExports: false,
  },
}));

export default config;

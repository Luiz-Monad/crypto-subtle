import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'
import multiEntry from '@rollup/plugin-multi-entry'

import path from 'path';
import Glob from 'glob';

const glob = (patt) => (cwd) => Glob.sync(patt, { cwd });

const vendored = {
  sjcl: ['./vendor-cjs/sjcl', glob('*')],
  forge: ['./vendor-cjs/forge', 'index.js'],
  rsa: ['./vendor-cjs/rsa', 'rsa.js'],
  keypairs: ['./vendor-cjs/keypairs', 'keypairs.js'],
  eckles: ['./vendor-cjs/eckles', 'eckles.js'],
  rasha: ['./vendor-cjs/rasha', 'rasha.js'],
}

const entrypoint = (root, input) =>
  (typeof input === 'string' ? [input] : Array.from(input(root)))
    .map(i => path.join(root, i));

const config = Object.entries(vendored).map(([libName, [root, input, plugins = []]]) => ({
  input: entrypoint(root, input),
  plugins: [
    ...plugins,
    babel({
      configFile: './.babelrc',
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
    multiEntry({
      entryFileName: 'index.js',
      exports: true,
      preserveModules: true,
    }),
  ],
  external: [
    'buffer-v6-polyfill',
    'crypto',
    'eckles',
    'https',
    'keypairs',
    'node-forge',
    'os',
    'rasha',
    'ursa',
    'ursa-optional',
  ],
  output: {
    dir: `vendor/${libName}`,
    format: 'es',
    preserveModules: true,
    minifyInternalExports: false,
  },
}));

export default config;

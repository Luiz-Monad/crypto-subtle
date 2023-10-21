import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'
import multiEntry from '@rollup/plugin-multi-entry'

import path from 'path';
import Glob from 'glob';

const glob = (patt) => (cwd) => Glob.sync(patt, { cwd });

const vendored = {
  sjcl: ['./node_modules/sjcl/core', glob('*')],
  forge: ['./node_modules/node-forge/lib', 'index.js'],
  rsa: ['./node_modules/rsa-compat/lib', 'rsa.js'],
  eckles: ['./node_modules/eckles/lib', 'eckles.js'],
  rasha: ['./node_modules/rasha/lib', 'rasha.js'],
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
      babelHelpers: 'bundled',
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
    'crypto',
    'module',
    'buffer',
    'buffer-v6-polyfill',
    'keypairs',
    'node-forge',
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

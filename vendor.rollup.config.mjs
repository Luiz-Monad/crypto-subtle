import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import entry from '@rollup/plugin-multi-entry'
import amd from 'rollup-plugin-amd';

import path from 'path';
import Glob from 'glob';

const glob = (patt) => (cwd) => Glob.sync(patt, { cwd });

const vendored = {
  forge: ['./node_modules/node-forge/js', 'forge.js'],
  sjcl: ['./node_modules/sjcl/core', glob('*'), [
    entry({
      entryFileName: 'index.js',
      preserveModules: true,
    })
  ]],
  rsa: ['./node_modules/rsa-compat/', 'index.js'],
}

const config = Object.entries(vendored).map(([output, [root, input, plugins = []]]) => ({
  input: (typeof input === 'string' ? [input] : Array.from(input(root))).map(i => `${root}/${i}`),
  plugins: [
    ...plugins,
    babel({
      babelHelpers: 'inline',
      configFile: './vendor.babelrc',
      skipPreflightCheck: true
    }),
    resolve({
      modulePaths: [
        path.resolve(`${root}/${output}`),
      ]
    }),
    amd(),
  ],
  external: [
    'crypto',
    'module',
    'buffer',
    'buffer-v6-polyfill',
  ],
  output: {
    dir: `vendor/${output}`,
    format: 'es',
    preserveModules: true,
  },
  logLevel: 'debug',
}));

export default config;

import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';
import multi from '@rollup/plugin-multi-entry';

import path from 'path';

const root = './src'

const config = {
  input: ['./src/main.js'],
  plugins: [
    babel({
      configFile: './.babelrc',
      babelHelpers: 'bundled'
    }),
    resolve({
      rootDir: root,
      moduleDirectories: [
        path.resolve(root),
      ],
      resolveOnly: (id) => {
        if (!(id.length === 2 && id[1] === ':'))
          console.log('resolving', id);
        return id;
      }
    }),
    commonjs({
      preserveModules: true,
      transformMixedEsModules: true,
    }),
    alias({
      entries: [
        /* browser */
        { find: 'crypto', replacement: './src/shim-crypto.js' },

        /* node */
        { find: 'module', replacement: './src/shim-node-module.js' },
        { find: 'os', replacement: './src/shim-node-os.js' },
        { find: 'buffer', replacement: './vendor/buffer/index.js' },

        /* not-used */
        { find: 'ecc-jsbn', replacement: './src/shim-ecc.js' },
        { find: 'ecc-qj', replacement: './src/shim-qj.js' },

        /* vendor */
        { find: 'sjcl', replacement: './vendor/sjcl/index.js' },
        { find: 'node-forge', replacement: './vendor/forge/index.js' },
        { find: 'rsa-compat', replacement: './vendor/rsa/rsa.js' },
        { find: 'keypairs', replacement: './vendor/keypairs/keypairs.js' },
        { find: 'rasha', replacement: './vendor/rasha/rasha.js' },
        { find: 'eckles', replacement: './vendor/eckles/eckles.js' },
      ],
      customResolver: (id) => {
        console.log('aliasing', id)
        return id
      }
    }),
    multi({
      entryFileName: 'index.js',
      exports: true,
      preserveModules: true,
    }),
  ],
  output: [{
    file: 'dist/subtle.js',
    format: 'iife',
    name: 'subtle',
    sourcemap: true,
  }, {
    file: 'dist/subtle.min.js',
    format: 'iife',
    name: 'subtle',
    sourcemap: true,
    plugins: [terser()],
  }, {
    dir: 'dist/es',
    format: 'es',
    name: 'subtle',
    sourcemap: true,
    preserveModules: true,
    minifyInternalExports: true,
  }],
};

export default config;

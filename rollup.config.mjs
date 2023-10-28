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
        { find: 'buffer', replacement: './src/shim-node-buffer.js' },

        /* not-used */
        { find: 'ecc-jsbn', replacement: './src/shim-ecc.js' },
        { find: 'ecc-qj', replacement: './src/shim-qj.js' },

        /* vendor */
        { find: 'sjcl', replacement: './src/shim-sjcl.js' },
        { find: 'node-forge', replacement: './src/shim-forge.js' },
        { find: 'rsa-compat', replacement: './src/shim-rsacompat.js' },
        { find: 'keypairs', replacement: './src/shim-keypairs.js' },
        { find: 'rasha', replacement: './src/shim-rasha.js' },
        { find: 'eckles', replacement: './src/shim-eckles.js' },
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

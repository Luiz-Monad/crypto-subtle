import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';

const config = {
  input: './src/main.js',
  plugins: [
    babel({
      configFile: './.babelrc',
      babelHelpers: 'bundled'
    }),
    alias({
      entries: [
        /* browser */
        { find: 'crypto', replacement: './src/shim-crypto.js' },

        /* node */
        { find: 'module', replacement: './src/shim-node-module.js' },
        { find: 'os', replacement: './src/shim-node-os.js' },
        { find: 'buffer-v6-polyfill', replacement: './node_modules/buffer/index.js' },

        /* not-used */
        { find: 'ecc-jsbn', replacement: './src/shim-ecc.js' },
        { find: 'ecc-qj', replacement: './src/shim-qj.js' },

        /* vendor */
        { find: 'sjcl', replacement: './vendor/sjcl/_virtual/_virtual_index.js' },
        { find: 'node-forge', replacement: './vendor/forge/_virtual/_virtual_index.js' },
        { find: 'rsa-compat', replacement: './vendor/rsa/_virtual/_virtual_index.js' },
        { find: 'keypairs', replacement: './vendor/keypairs/_virtual/_virtual_index.js' },
        { find: 'rasha', replacement: './vendor/rasha/_virtual/_virtual_index.js' },
        { find: 'eckles', replacement: './vendor/eckles/_virtual/_virtual_index.js' },
      ],
      customResolver: (id) => {
        console.log('aliasing', id)
        return id
      }
    }),
    resolve({
      resolveOnly: (id) => {
        console.log('resolving', id)
        return id
      }
    }),
    commonjs({
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
    minifyInternalExports: false,
  }],
};

export default config;

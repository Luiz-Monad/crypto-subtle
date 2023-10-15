import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';

const config = {
  input: './src/main.js',
  plugins: [
    babel({ babelHelpers: 'inline' }),
    alias({
      entries: [
        { find: 'node-forge', replacement: './dist/forge.js' },
        { find: 'crypto', replacement: './src/shim-crypto.js' },
        { find: 'ecc-jsbn', replacement: './src/shim-ecc.js' },
        { find: 'ecc-qj', replacement: './src/shim-qj.js' },
        { find: 'ursa', replacement: './src/shim-ursa.js' },
        { find: 'ursa-optional', replacement: './src/shim-ursa.js' },
        { find: 'os', replacement: './src/shim-node-os.js' },
        { find: 'module', replacement: './src/shim-node-module.js' },
        { find: 'buffer-v6-polyfill', replacement: './node_modules/buffer/index.js' }
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
    commonjs(),
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
  }],
};

export default config;

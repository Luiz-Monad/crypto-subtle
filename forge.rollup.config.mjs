import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import amd from 'rollup-plugin-amd';
import path from 'node:path';

const config = {
  input: './node_modules/node-forge/js/forge.js',
  plugins: [
    babel({
      babelHelpers: 'inline',
      configFile: './forge.babelrc',
      skipPreflightCheck: true
    }),
    resolve({
      modulePaths: [
        path.resolve('./node_modules/node-forge/js/'),
      ]
    }),
    amd(),
  ],
  output: {
    file: 'dist/forge.js',
    format: 'cjs',
    sourcemap: true,
  }
};

export default config;

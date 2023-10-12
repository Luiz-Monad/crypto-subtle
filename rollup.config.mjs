import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const config = {
    input: './src/main.js',
    plugins: [
        resolve(),
        commonjs(),
        babel({ babelHelpers: 'bundled' })
    ],
    output: {
        file: 'dist/subtle.js',
        format: 'iife',
        
    }
};

export default config;

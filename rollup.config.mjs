import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const config = {
    input: './src/main.js',
    plugins: [
        replace({
            'node-forge': './dist/node-forge.js'
        }),
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

ls .\node_modules\node-forge\js\*.js | select -exp name | foreach -parallel { 
    babel .\node_modules\node-forge\js\$_ --out-file dist/forge/$_ --config-file '.\forge.babelrc' }
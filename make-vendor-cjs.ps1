
function parallel ([ScriptBlock]$sb) {
    begin {
        $threads = @()
    }
    process { 
        $threads += Start-ThreadJob -ArgumentList $_ -ScriptBlock $sb
    }
    end {
        $threads | Receive-Job -Wait
        $threads | Remove-Job 
    }
}

function bundler ($base, $target) {
        
    Get-ChildItem (Join-path $base '*.js')  -Recurse | 
    Where-Object { $_.FullName.Replace('\', '/') -notlike '*/bin/*' } |
    Where-Object { $_.FullName -notlike '*.min.js' } |
    Select-Object -ExpandProperty fullname | 
    parallel {
        param($f)
        Write-Host -ForegroundColor Yellow $f

        function rel ($base, $path) { 
            Resolve-Path $path -Relative -RelativeBasePath $base 
        }
        
        function babelify ($in, $out) {
            babel $in --out-file $out --config-file '.\vendor.cjs.babelrc'
        }

        babelify -in $f -out (Join-Path $using:target (rel $using:base $f)) 
    }

}

# =====================================================================================

bundler './node_modules/node-forge/lib/' 'vendor-cjs/forge'
bundler './node_modules/sjcl/core/' 'vendor-cjs/sjcl'
bundler './node_modules/rsa-compat/lib/' 'vendor-cjs/rsa'
bundler './node_modules/keypairs/' 'vendor-cjs/keypairs'
bundler './node_modules/eckles/lib/' 'vendor-cjs/eckles'
bundler './node_modules/rasha/lib/' 'vendor-cjs/rasha'
bundler './node_modules/buffer/' 'vendor-cjs/buffer'
bundler './node_modules/base64-js/' 'vendor-cjs/buffer/base64'
bundler './node_modules/ieee754/' 'vendor-cjs/buffer/ieee754'

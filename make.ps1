
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
        
    Get-ChildItem (Join-path $base '*.js') -Recurse | 
    Select-Object -ExpandProperty fullname | 
    parallel {
        param($f)
        Write-Host -ForegroundColor Yellow $f

        function rel ($base, $path) { 
            Resolve-Path $path -Relative -RelativeBasePath $base 
        }
        
        function babelify ($in, $out) {
            babel $in --out-file $out --config-file '.\vendor.babelrc'
        }

        babelify -in $f -out (Join-Path $using:target (rel $using:base $f)) 
    }

}

# =====================================================================================

bundler './node_modules/node-forge/lib/' 'vendor/forge'

bundler './node_modules/sjcl/core/' 'vendor/sjcl'

bundler './node_modules/rsa-compat/lib/' 'vendor/rsa'


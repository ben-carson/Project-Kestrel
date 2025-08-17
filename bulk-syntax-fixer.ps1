# Bulk TypeScript Syntax Error Fixer
# Fixes all the systematic syntax errors caused by PowerShell string interpolation

param(
    [string]$ProjectPath = ".",
    [switch]$DryRun = $false,
    [switch]$CreateBackup = $true
)

function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warn    { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Fail    { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info    { param($Message) Write-Host $Message -ForegroundColor Cyan }

Write-Host @'
🔧 Bulk TypeScript Syntax Error Fixer
======================================
Fixing all systematic syntax errors...
'@ -ForegroundColor Magenta

$Stats = @{
    FilesScanned = 0
    FilesFixed = 0
    ErrorsFixed = 0
    BackupsCreated = 0
    Errors = 0
}

# Create backup directory
$BackupPath = Join-Path $ProjectPath ".bulk-syntax-fix-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if ($CreateBackup -and !$DryRun) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Info "📁 Created backup directory: $BackupPath"
}

function Backup-File {
    param($FilePath)
    if ($CreateBackup -and !$DryRun) {
        $RelativePath = $FilePath.Replace($ProjectPath, "").TrimStart('\', '/')
        $BackupFile = Join-Path $BackupPath $RelativePath
        $BackupDir = Split-Path $BackupFile -Parent
        if (!(Test-Path $BackupDir)) {
            New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        }
        Copy-Item $FilePath $BackupFile -Force
        $Stats.BackupsCreated++
    }
}

# Define all the systematic error patterns and their fixes
$FixPatterns = @(
    # Function declarations with wrong syntax
    @{
        Name = "Function declarations with colon syntax"
        Pattern = '(export\s+)?function\s+(\w+)\s*:\s*\([^)]*\)\s*=>\s*\{'
        Replacement = { param($m) 
            $export = if ($m.Groups[1].Success) { $m.Groups[1].Value } else { "" }
            $name = $m.Groups[2].Value
            $params = $m.Value -replace '^.*?:\s*\(([^)]*)\).*$', '$1'
            "${export}function $name($params) {"
        }
    },
    
    # Async function declarations with wrong syntax
    @{
        Name = "Async function declarations with colon syntax"
        Pattern = '(export\s+)?async\s+function\s+(\w+)\s*:\s*\([^)]*\)\s*=>\s*\{'
        Replacement = { param($m)
            $export = if ($m.Groups[1].Success) { $m.Groups[1].Value } else { "" }
            $name = $m.Groups[2].Value
            $params = $m.Value -replace '^.*?:\s*\(([^)]*)\).*$', '$1'
            "${export}async function $name($params) {"
        }
    },
    
    # Constructor with wrong syntax
    @{
        Name = "Constructor with colon syntax"
        Pattern = 'constructor\s*:\s*\([^)]*\)\s*=>\s*\{'
        Replacement = { param($m)
            $params = $m.Value -replace '^constructor\s*:\s*\(([^)]*)\).*$', '$1'
            "constructor($params) {"
        }
    },
    
    # Class methods with object syntax
    @{
        Name = "Class methods with object syntax"
        Pattern = '(\w+)\s*:\s*\([^)]*\)\s*=>\s*\{'
        Replacement = { param($m)
            $methodName = $m.Groups[1].Value
            $params = $m.Value -replace '^.*?:\s*\(([^)]*)\).*$', '$1'
            "$methodName($params) {"
        }
    },
    
    # If statements with wrong syntax
    @{
        Name = "If statements with colon syntax"
        Pattern = 'if\s*:\s*\([^)]*\)\s*=>\s*\{'
        Replacement = { param($m)
            $condition = $m.Value -replace '^if\s*:\s*\(([^)]*)\).*$', '$1'
            "if ($condition) {"
        }
    },
    
    # Arrow functions missing =>
    @{
        Name = "Arrow functions missing =>"
        Pattern = 'return\s*\(\s*[^)]*\)\s*\{'
        Replacement = { param($m)
            $m.Value -replace 'return\s*(\([^)]*\))\s*\{', 'return $1 => {'
        }
    },
    
    # Function parameters missing => in type annotations
    @{
        Name = "Function parameter types missing =>"
        Pattern = '\(\s*\w+\s*:\s*\([^)]*\)\s+(\w+)\s*\)'
        Replacement = { param($m)
            $m.Value -replace '\(([^:]+):\s*\(([^)]*)\)\s+(\w+)\s*\)', '($1: ($2) => $3)'
        }
    }
)

function Fix-TypeScriptFile {
    param($FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        $fixCount = 0
        
        foreach ($pattern in $FixPatterns) {
            $matches = [regex]::Matches($content, $pattern.Pattern)
            if ($matches.Count -gt 0) {
                if ($pattern.Replacement -is [scriptblock]) {
                    $content = [regex]::Replace($content, $pattern.Pattern, $pattern.Replacement)
                } else {
                    $content = $content -replace $pattern.Pattern, $pattern.Replacement
                }
                $fixCount += $matches.Count
                Write-Info "  Fixed $($matches.Count) instances of: $($pattern.Name)"
            }
        }
        
        # Additional manual fixes for common patterns
        $manualFixes = @(
            # Fix missing => in arrow functions
            @{ From = 'return \(\) ([a-zA-Z])'; To = 'return () => $1' },
            # Fix missing => in function types
            @{ From = '\(([^)]+): \(([^)]+)\) (\w+)\)'; To = '($1: ($2) => $3)' },
            # Fix malformed if conditions
            @{ From = 'if:\s*\(([^)]+)\) =>'; To = 'if ($1)' }
        )
        
        foreach ($fix in $manualFixes) {
            if ($content -match $fix.From) {
                $content = $content -replace $fix.From, $fix.To
                $fixCount++
            }
        }
        
        if ($fixCount -gt 0 -and $content -ne $originalContent) {
            if (!$DryRun) {
                Backup-File $FilePath
                Set-Content -Path $FilePath -Value $content -Encoding UTF8
            }
            $relativePath = $FilePath.Replace($ProjectPath, '').TrimStart('\','/')
            Write-Success "✅ Fixed $fixCount errors in: $relativePath"
            $Stats.FilesFixed++
            $Stats.ErrorsFixed += $fixCount
            return $true
        }
        
        return $false
        
    } catch {
        Write-Fail "❌ Error processing $FilePath`: $_"
        $Stats.Errors++
        return $false
    }
}

# Main execution
if ($DryRun) {
    Write-Warn "🧪 DRY RUN MODE - No files will be modified"
}

Write-Info "🔍 Finding TypeScript/JavaScript files..."

# Get all TS/JS files in src directory
$srcPath = Join-Path $ProjectPath "src"
if (!(Test-Path $srcPath)) {
    Write-Fail "❌ Source directory not found: $srcPath"
    exit 1
}

$fileExtensions = @("*.ts", "*.tsx", "*.js", "*.jsx")
$filesToProcess = @()

foreach ($extension in $fileExtensions) {
    $files = Get-ChildItem -Path $srcPath -Filter $extension -Recurse -File | Where-Object {
        $_.FullName -notmatch '\\node_modules\\' -and 
        $_.FullName -notmatch '\\.git\\' -and
        $_.FullName -notmatch '\\dist\\' -and
        $_.FullName -notmatch '\\build\\'
    }
    $filesToProcess += $files
}

Write-Info "📂 Found $($filesToProcess.Count) files to process..."

foreach ($file in $filesToProcess) {
    $Stats.FilesScanned++
    Write-Host "🔍 Processing: $($file.FullName.Replace($ProjectPath, '.'))" -ForegroundColor DarkGray
    Fix-TypeScriptFile $file.FullName
}

# Generate summary report
Write-Host @'

📊 BULK SYNTAX FIXER SUMMARY
=============================
'@ -ForegroundColor Cyan

Write-Host "Files Scanned:   $($Stats.FilesScanned)" -ForegroundColor Cyan
Write-Host "Files Fixed:     $($Stats.FilesFixed)" -ForegroundColor Cyan
Write-Host "Errors Fixed:    $($Stats.ErrorsFixed)" -ForegroundColor Cyan
Write-Host "Backups Created: $($Stats.BackupsCreated)" -ForegroundColor Cyan
Write-Host "Errors:          $($Stats.Errors)" -ForegroundColor Cyan

if ($Stats.ErrorsFixed -gt 0) {
    Write-Success "🎉 Fixed $($Stats.ErrorsFixed) syntax errors across $($Stats.FilesFixed) files!"
    Write-Info "💡 Try running 'npm run build' or 'npm run dev' now"
} else {
    Write-Info "✨ No systematic syntax errors found"
}

if ($Stats.Errors -gt 0) {
    Write-Fail "⚠️  Encountered $($Stats.Errors) errors during processing"
}

if ($CreateBackup -and !$DryRun -and $Stats.BackupsCreated -gt 0) {
    Write-Info "💾 Backups saved to: $BackupPath"
}

Write-Success "✅ Bulk syntax fixing complete!"
param(
  [string]$ProjectPath = ".",
  [switch]$DryRun = $false,
  [switch]$Verbose = $true,
  [switch]$CreateBackup = $true
)

function Log([string]$m,[string]$c="Gray"){ Write-Host $m -ForegroundColor $c }
function Ok([string]$m){ Log $m "Green" }
function Info([string]$m){ Log $m "Cyan" }
function Warn([string]$m){ Log $m "Yellow" }
function Err([string]$m){ Log $m "Red" }

Write-Host "`nBulk Syntax Fixer (SAFE) v1`n============================`n" -ForegroundColor Magenta

if (!(Test-Path $ProjectPath)) { Err "Path not found: $ProjectPath"; exit 1 }

$src = Join-Path $ProjectPath "src"
if (!(Test-Path $src)) { Err "No 'src' directory under $ProjectPath"; exit 1 }

# Collect files (.ts, .tsx, .js, .jsx), excluding typical build/test dirs
$files = Get-ChildItem -Path $src -Recurse -Include *.ts,*.tsx,*.js,*.jsx `
  | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\build\\|\\.turbo\\|\\coverage\\|\\.d\\.ts$' } `
  | ForEach-Object { $_.FullName }

function Apply-Rules {
  param(
    [string]$Path,
    [array]$Rules
  )
  $text = Get-Content -LiteralPath $Path -Raw
  $updated = $text
  $applied = @()

  foreach ($rule in $Rules) {
    $before = $updated
    $updated = [regex]::Replace($updated, $rule.Pattern, $rule.Replace, 'Multiline')
    if ($updated -ne $before) {
      $applied += $rule.Name
      if ($Verbose) { Info "  • $([IO.Path]::GetFileName($Path)): $($rule.Note) [$($rule.Name)]" }
    }
  }

  if ($applied.Count -gt 0) {
    if ($DryRun) {
      Warn "DRY RUN: $Path would be patched ($($applied.Count) change group(s))"
    } else {
      if ($CreateBackup) {
        $bak = "$Path.bak_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item -LiteralPath $Path -Destination $bak -Force
        Info "  Backup: $bak"
      }
      Set-Content -LiteralPath $Path -Value $updated -NoNewline
      Ok "Patched: $Path ($($applied.Count) change group(s))"
    }
  }
  return $applied.Count
}

# --- RULES (SAFE) ---
$rules = @(
  # 1) Fix 'export function name: (params) => {' -> 'export function name(params) {'
  [pscustomobject]@{
    Name = "ExportFunctionColonArrow"
    Pattern = '^(?<indent>\s*)(?<export>export\s+)?function\s+(?<name>[A-Za-z_]\w*)\s*:\s*\((?<params>[^)]*)\)\s*=>\s*\{'
    Replace = '${indent}${export}function ${name}(${params}) {'
    Note = "Fix invalid 'function name: (...) => {' to standard function decl"
  },

  # 2) Fix 'constructor: (params) => {' -> 'constructor(params) {'
  [pscustomobject]@{
    Name = "ConstructorColonArrow"
    Pattern = '^(?<indent>\s*)constructor\s*:\s*\((?<params>[^)]*)\)\s*=>\s*\{'
    Replace = '${indent}constructor(${params}) {'
    Note = "Fix invalid 'constructor: (...) => {'"
  },

  # 3) IF colon-arrow (very narrow): 'if: (cond) => {' -> 'if (cond) {'
  [pscustomobject]@{
    Name = "IfColonArrow"
    Pattern = '^(?<indent>\s*)if\s*:\s*\((?<cond>[^)]*)\)\s*=>\s*\{'
    Replace = '${indent}if (${cond}) {'
    Note = "Fix invalid 'if: (...) => {' only when at start-of-line"
  },

  # 4) Fix the specific object-literal typed method misuse seen in registrar.ts
  #    'addSystemItem(reg: SystemItemRegistration) {' -> 'addSystemItem: (reg: SystemItemRegistration) => {'
  #    Scope check is handled by a file filter below.
  [pscustomobject]@{
    Name = "RegistrarTypedMethodToArrow"
    Pattern = '(^|\s)addSystemItem\s*\(\s*([^)]+)\s*\)\s*\{'
    Replace = '$1addSystemItem: ($2) => {'
    Note = "Convert typed object-literal method to property arrow (registrar.ts only)"
    FileFilter = 'core\\registrar\.ts$'
  }
)

# Apply rules
$total = 0
foreach ($f in $files) {
  # Optional per-rule file filter
  $filtered = @()
  foreach ($r in $rules) {
    if ($r.PSObject.Properties.Name -contains 'FileFilter') {
      if ($f -match $r.FileFilter) { $filtered += $r }
    } else {
      $filtered += $r
    }
  }
  if ($filtered.Count -eq 0) { continue }
  $total += Apply-Rules -Path $f -Rules $filtered
}

# Separate pass: environment access fix (esbuild import.meta.env parser trap)
# Replace [flag as keyof typeof import.meta.env] with [flag as any]
# And normalize import.meta.env[...] to (import.meta as any).env[...]
$envRules = @(
  [pscustomobject]@{
    Name = "EnvIndexKeyofAny"
    Pattern = '\[\s*([^\]]+?)\s+as\s+keyof\s+typeof\s+import\.meta\.env\s*\]'
    Replace = '[$1 as any]'
    Note = "Remove 'keyof typeof import.meta.env' in computed index"
  },
  [pscustomobject]@{
    Name = "EnvComputedSafe"
    Pattern = 'import\.meta\.env(\s*\[)'
    Replace = '(import.meta as any).env$1'
    Note = "Normalize computed env access"
  },
  [pscustomobject]@{
    Name = "EnvDotSafe"
    Pattern = 'import\.meta\.env\.'
    Replace = '(import.meta as any).env.'
    Note = "Normalize dot env access"
  }
)

foreach ($f in $files) {
  $total += Apply-Rules -Path $f -Rules $envRules
}

if ($total -eq 0) {
  Warn "No changes applied. Either already fixed or patterns did not match."
} else {
  Ok "`nTotal change groups applied: $total"
}

Info "`nTip: run a type/syntax check before building:"
Write-Host "  npx tsc --noEmit" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White

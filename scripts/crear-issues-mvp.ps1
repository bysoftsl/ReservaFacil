#Requires -Version 5.1
<#
.SYNOPSIS
Genera los issues del plan de ReservaFacil. Sin -Apply solo muestra la vista previa.
.EXAMPLE
.\scripts\crear-issues-mvp.ps1
.EXAMPLE
gh auth login --hostname github.com
.\scripts\crear-issues-mvp.ps1 -Apply
#>
[CmdletBinding()]
param(
    [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9-]*/[a-zA-Z0-9_.-]+$')]
    [string]$Repository = 'bysoftsl/ReservaFacil',

    [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$milestoneTitle = 'MVP v1.0'
$docs = Join-Path (Split-Path -Parent $PSScriptRoot) 'docs'
$plan = [IO.File]::ReadAllText((Join-Path $docs 'plan.md')) -replace '\r\n', "`n"
$spec = [IO.File]::ReadAllText((Join-Path $docs 'spec.md')) -replace '\r\n', "`n"
$docsUrl = "https://github.com/$Repository/blob/HEAD/docs"

$labelColors = [ordered]@{
    infra = '5319E7'
    domain = '1D76DB'
    api = '0052CC'
    db = '0E8A16'
    security = 'B60205'
    testing = 'FBCA04'
}

$taskMetadata = @{
    1  = @{ Labels = @('infra', 'testing'); Cases = @() }
    2  = @{ Labels = @('domain', 'testing'); Cases = @(14, 41, 42, 43, 63, 83, 91, 92, 93, 94, 95) }
    3  = @{ Labels = @('api', 'testing'); Cases = @(2, 3, 17, '027-bis', 70, 75, 90) }
    4  = @{ Labels = @('infra', 'db', 'testing'); Cases = @('027-bis', 43, 64, 65) }
    5  = @{ Labels = @('api', 'security'); Cases = @(1, 2, 3, 4, 5, 6) }
    6  = @{ Labels = @('domain', 'api', 'db'); Cases = @((7..17) + @(91, 95)) }
    7  = @{ Labels = @('domain', 'api', 'db'); Cases = @(44, 45, 46, 90) }
    8  = @{ Labels = @('domain', 'db', 'testing'); Cases = @(18, 24, 25, 26, 66, 67, 72, 73, 74) }
    9  = @{ Labels = @('domain', 'api', 'db', 'testing'); Cases = @(19, 20, 22, 23, 24, 27, '027-bis', 30, 31, 75, 90) }
    10 = @{ Labels = @('domain', 'api', 'db'); Cases = @(21, 28, 29, 32, 33, 34, 35, 36, 64, 65, 75, 90, 94) }
    11 = @{ Labels = @('domain', 'api', 'db'); Cases = @(41, 42, 43, 63, 76, 77, 78, 80, 81, 83, 92, 93) }
    12 = @{ Labels = @('domain', 'api', 'infra'); Cases = @(37, 38, 39, 40, 79, 82, 89, 90) }
    13 = @{ Labels = @('domain', 'api', 'db'); Cases = @(46, 47, 48, 49, 84, 90) }
    14 = @{ Labels = @('api', 'db', 'security'); Cases = @(50, 51, 52, 53, 54, 85) }
    15 = @{ Labels = @('api', 'db', 'security'); Cases = @((55..62) + (86..88)) }
    16 = @{ Labels = @('api', 'testing'); Cases = @(1, 2, 3, 19, 27, '027-bis', 30, 39, 43, 86, 87, 90, 93, 94) }
    17 = @{ Labels = @('infra', 'security', 'testing'); Cases = @(68, 69, 70, 71) }
}

$criteria = @{}
$casePattern = '(?ms)^  @(?<id>CA-\d{3}(?:-bis)?)\b.*?\n  (?:Escenario|Esquema del escenario): (?<title>[^\n]+)\n(?<steps>.*?)(?=^  @CA-|^```|\z)'
foreach ($match in [regex]::Matches($spec, $casePattern)) {
    $id = $match.Groups['id'].Value
    if ($criteria.ContainsKey($id)) {
        throw "Criterio duplicado en spec.md: $id"
    }
    $criteria[$id] = [pscustomobject]@{
        Title = $match.Groups['title'].Value
        Line = [regex]::Matches($spec.Substring(0, $match.Index), "`n").Count + 1
        Scenario = ($match.Value.TrimEnd() -replace '(?m)^  ', '')
    }
}

$tasks = [regex]::Match($plan, '(?ms)^## 4\.[^\n]*\n(?<content>.*?)(?=^## |\z)')
$taskPattern = '(?m)^\| (?<hito>[^|\n]+?) \| \*\*Tarea (?<number>\d+) \u2014 (?<title>[^|\n]+?)\*\* \| (?<deliverable>[^|\n]+?) \|$'
$rows = [regex]::Matches($tasks.Groups['content'].Value, $taskPattern)
if ($rows.Count -ne $taskMetadata.Count) {
    throw 'Las tareas del plan no coinciden con el mapa de etiquetas y criterios.'
}

$issues = @(
    for ($index = 0; $index -lt $rows.Count; $index++) {
        $row = $rows[$index]
        $number = [int]$row.Groups['number'].Value
        if ($number -ne ($index + 1) -or -not $taskMetadata.ContainsKey($number)) {
            throw "Tarea sin correspondencia o fuera de orden: $number"
        }

        $meta = $taskMetadata[$number]
        $title = "[Tarea $number] $($row.Groups['title'].Value)"
        $body = @(
            "Hito del plan: **$($row.Groups['hito'].Value)**"
            ''
            '## Entregable verificable'
            $row.Groups['deliverable'].Value
            ''
            '## Criterios de aceptacion'
        )
        $scenarios = @()
        foreach ($case in $meta.Cases) {
            $id = if ($case -is [int]) { 'CA-{0:D3}' -f $case } else { "CA-$case" }
            if (-not $criteria.ContainsKey($id)) {
                throw "$title referencia un criterio inexistente: $id"
            }
            $criterion = $criteria[$id]
            $body += "- [ ] [$id]($docsUrl/spec.md#L$($criterion.Line)): $($criterion.Title)"
            $scenarios += $criterion.Scenario
        }
        if ($scenarios.Count -eq 0) {
            $body += 'No hay un CA directo en la especificacion para el scaffolding. Aplican las comprobaciones del entregable.'
        }
        else {
            $body += @(
                ''
                '<details>'
                '<summary>Escenarios Gherkin de referencia</summary>'
                ''
                '```gherkin'
                ($scenarios -join "`n`n")
                '```'
                ''
                '</details>'
            )
        }
        $body += @('', "[Plan de implementacion]($docsUrl/plan.md)")

        [pscustomobject]@{
            Number = $number
            Title = $title
            Labels = $meta.Labels
            Body = $body -join "`n"
        }
    }
)

if (-not $Apply) {
    Write-Output "Vista previa: $($issues.Count) issues en $Repository / $milestoneTitle. No se escribe en GitHub."
    foreach ($issue in $issues) {
        Write-Output ("`n---`n# {0}`nLabels: {1}`n`n{2}" -f $issue.Title, ($issue.Labels -join ', '), $issue.Body)
    }
    return
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'Instala GitHub CLI (gh) y ejecuta gh auth login --hostname github.com.'
}

function Invoke-Gh([string[]]$Arguments) {
    $output = & gh @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "gh $($Arguments[0]) fallo (codigo $LASTEXITCODE). Revisa el error de GitHub CLI."
    }
    $output
}

function Get-GitHubItems([string]$Endpoint) {
    $json = (Invoke-Gh @('api', $Endpoint, '--hostname', 'github.com', '--paginate', '--slurp')) -join "`n"
    $response = ConvertFrom-Json -InputObject ('{"pages":' + $json + '}')
    foreach ($page in $response.pages) {
        foreach ($item in $page) {
            $item
        }
    }
}

$milestones = @(
    Get-GitHubItems "repos/$Repository/milestones?state=all&per_page=100" |
        Where-Object { $_.title -ceq $milestoneTitle }
)
if ($milestones.Count -gt 1 -or ($milestones.Count -eq 1 -and $milestones[0].state -ne 'open')) {
    throw "El milestone '$milestoneTitle' no es un milestone abierto e inequivoco."
}

$existing = @{}
foreach ($item in (Get-GitHubItems "repos/$Repository/issues?state=all&per_page=100")) {
    if ($item.PSObject.Properties['pull_request'] -or $item.title -notmatch '^\[Tarea (\d+)\]') {
        continue
    }
    $number = [int]$Matches[1]
    if (-not $taskMetadata.ContainsKey($number)) {
        continue
    }
    if ($existing.ContainsKey($number)) {
        throw "Hay mas de un issue con el marcador [Tarea $number]."
    }
    if ($milestones.Count -ne 1 -or $null -eq $item.milestone -or $item.milestone.number -ne $milestones[0].number) {
        throw "El issue #$($item.number) para [Tarea $number] no pertenece a '$milestoneTitle'. Revisalo antes de reintentar."
    }
    $existing[$number] = $item.number
}

if ($milestones.Count -eq 0) {
    $null = Invoke-Gh @('api', "repos/$Repository/milestones", '--hostname', 'github.com', '--method', 'POST', '-f', "title=$milestoneTitle")
}

$missingIssues = @($issues | Where-Object { -not $existing.ContainsKey($_.Number) })
if ($missingIssues.Count -gt 0) {
    $repoArg = "github.com/$Repository"
    $labels = @(Get-GitHubItems "repos/$Repository/labels?per_page=100" | ForEach-Object { $_.name })
    foreach ($label in ($missingIssues.Labels | Sort-Object -Unique)) {
        if ($label -notin $labels) {
            $null = Invoke-Gh @('label', 'create', $label, '--repo', $repoArg, '--color', $labelColors[$label])
        }
    }

    $bodyFile = [IO.Path]::GetTempFileName()
    try {
        foreach ($issue in $missingIssues) {
            [IO.File]::WriteAllText($bodyFile, $issue.Body, [Text.UTF8Encoding]::new($false))
            Invoke-Gh @(
                'issue', 'create', '--repo', $repoArg, '--title', $issue.Title, '--body-file', $bodyFile,
                '--milestone', $milestoneTitle, '--label', ($issue.Labels -join ',')
            )
        }
    }
    finally {
        Remove-Item -LiteralPath $bodyFile
    }
}

Write-Output "$($missingIssues.Count) issues creados; $($existing.Count) ya existian en '$milestoneTitle'."

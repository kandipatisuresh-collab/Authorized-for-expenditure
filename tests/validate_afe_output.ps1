[CmdletBinding(DefaultParameterSetName = 'File')]
param(
    [Parameter(Mandatory = $true, ParameterSetName = 'File')]
    [string]$Path,

    [Parameter(Mandatory = $true, ParameterSetName = 'SelfTest')]
    [switch]$SelfTest,

    [Parameter(ParameterSetName = 'File')]
    [switch]$AllowPendingInputs
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function ConvertTo-Cells {
    param([string]$Line)

    $trimmed = $Line.Trim()
    if ($trimmed.StartsWith('|')) {
        $trimmed = $trimmed.Substring(1)
    }
    if ($trimmed.EndsWith('|')) {
        $trimmed = $trimmed.Substring(0, $trimmed.Length - 1)
    }
    return ,@($trimmed.Split('|') | ForEach-Object { $_.Trim() })
}

function Find-Column {
    param(
        [string[]]$Header,
        [string]$Pattern
    )

    for ($index = 0; $index -lt $Header.Count; $index++) {
        if ($Header[$index] -match $Pattern) {
            return $index
        }
    }
    return -1
}

function Get-Money {
    param([string]$Text)

    if ($Text -match '(?<![A-Za-z0-9])(-\s*\$?\s*|\$?\s*-?\s*)(\d[\d,]*(?:\.\d{1,2})?)') {
        $number = $Matches[2] -replace ',', ''
        $amount = [decimal]::Parse(
            $number,
            [Globalization.NumberStyles]::Number,
            [Globalization.CultureInfo]::InvariantCulture
        )
        if ($Matches[1] -match '-') {
            if ($amount -gt 0) {
                $amount = -$amount
            }
        }
        return $amount
    }
    return $null
}

function Get-MarkdownTables {
    param([string[]]$Lines)

    $tables = @()
    for ($index = 0; $index -lt $Lines.Count; $index++) {
        if ($Lines[$index] -notmatch '^\s*\|') {
            continue
        }

        $header = ConvertTo-Cells $Lines[$index]
        if ($index + 1 -ge $Lines.Count -or $Lines[$index + 1] -notmatch '^\s*\|') {
            continue
        }
        if ($Lines[$index + 1] -notmatch '^\s*\|[\s:|-]+\|\s*$') {
            continue
        }

        $rows = @()
        $rowIndex = $index + 2
        while ($rowIndex -lt $Lines.Count -and $Lines[$rowIndex] -match '^\s*\|') {
            $rows += ,(ConvertTo-Cells $Lines[$rowIndex])
            $rowIndex++
        }
        $tables += [PSCustomObject]@{ Header = $header; Rows = $rows }
        $index = $rowIndex - 1
    }
    return $tables
}

function Get-AmountAt {
    param(
        [string[]]$Cells,
        [int]$Column
    )

    if ($Column -lt 0 -or $Column -ge $Cells.Count) {
        return $null
    }
    return Get-Money $Cells[$Column]
}

function Test-AfeText {
    param(
        [string]$Text,
        [switch]$PermitPending
    )

    $errors = [System.Collections.Generic.List[string]]::new()
    $lines = @($Text -split "\r?\n")
    $requiredHeadings = @(
        '# AUTHORIZATION FOR EXPENDITURE (AFE)',
        '## 1. GENERAL & OPERATIONAL HEADER',
        '## 2. PARTNER PARTICIPATION SCHEDULE',
        '## 3. COST ESTIMATE BREAKDOWN',
        '### A. Intangible Costs (IDC)',
        '### B. Tangible Costs (TDC)',
        '### C. FINANCIAL SUMMARY',
        '## 4. JUSTIFICATION & OPERATIONAL SCOPE',
        '## 5. APPROVAL ROUTING & SIGN-OFF BLOCKS'
    )

    if ($lines.Count -eq 0 -or $lines[0].Trim() -ne $requiredHeadings[0]) {
        $errors.Add('The document must start with the AFE title.')
    }

    $lastHeadingIndex = -1
    foreach ($heading in $requiredHeadings) {
        $headingIndex = [Array]::IndexOf($lines, $heading)
        if ($headingIndex -lt 0) {
            $errors.Add("Missing required heading: $heading")
            continue
        }
        if ($headingIndex -le $lastHeadingIndex) {
            $errors.Add("Required headings are out of order at: $heading")
        }
        $lastHeadingIndex = $headingIndex
    }

    foreach ($approval in @(
        'Prepared By:',
        'Reviewed By (Operations/Engineering):',
        'Reviewed By (Finance/Joint Interest Accounting):',
        'Approved By (Executive Management/CEO):'
    )) {
        if (-not ($Text -match [regex]::Escape($approval))) {
            $errors.Add("Missing approval role: $approval")
        }
    }

    $tables = @(Get-MarkdownTables $lines)
    $costTables = @($tables | Where-Object {
        ($_.Header -join ' ') -match 'Cost Code' -and
        ($_.Header -join ' ') -match 'Estimated Gross Cost'
    })
    if ($costTables.Count -ne 2) {
        $errors.Add("Expected exactly two IDC/TDC cost tables; found $($costTables.Count).")
    }

    $seen = @{}
    $pendingCosts = [System.Collections.Generic.List[string]]::new()
    $pendingCategories = @{}
    $categoryTotals = @{}
    foreach ($costTable in $costTables) {
        $headers = [string[]]$costTable.Header
        $codeColumn = Find-Column $headers 'Cost Code'
        $descriptionColumn = Find-Column $headers 'Description'
        $quantityColumn = Find-Column $headers 'Units|Quantity'
        $unitCostColumn = Find-Column $headers 'Unit Cost'
        $grossColumn = Find-Column $headers 'Estimated Gross Cost'
        $basisColumn = Find-Column $headers 'Estimate Basis'
        $firstCode = [int]::MaxValue

        foreach ($row in $costTable.Rows) {
            if ($codeColumn -lt 0 -or $codeColumn -ge $row.Count) {
                continue
            }
            $codeText = $row[$codeColumn] -replace '[^0-9]', ''
            if ($codeText -notmatch '^(10[1-9]|110|20[1-7])$') {
                continue
            }

            $code = [int]$codeText
            if ($code -lt $firstCode) {
                $firstCode = $code
            }
            if ($seen.ContainsKey($code)) {
                $errors.Add("Cost code $code appears more than once.")
                continue
            }
            $seen[$code] = $true

            $description = if ($descriptionColumn -ge 0 -and $descriptionColumn -lt $row.Count) {
                $row[$descriptionColumn]
            } else {
                ''
            }
            $amount = Get-AmountAt $row $grossColumn
            if ($null -eq $amount) {
                $grossText = if ($grossColumn -ge 0 -and $grossColumn -lt $row.Count) {
                    $row[$grossColumn]
                } else {
                    ''
                }
                if ($grossText -match '(?i)pending|not provided|unknown|tbd|\[.*\]') {
                    $pendingCosts.Add("Cost code $code")
                    $pendingCategory = if ($code -lt 200) { 'IDC' } else { 'TDC' }
                    $pendingCategories[$pendingCategory] = $true
                } else {
                    $errors.Add("Cost code $code has no numeric gross amount or explicit pending-input marker.")
                }
                continue
            }
            if ($amount -lt 0) {
                $errors.Add("Cost code $code has a negative gross amount.")
            }

            if ($basisColumn -ge 0 -and $basisColumn -lt $row.Count -and
                [string]::IsNullOrWhiteSpace($row[$basisColumn])) {
                $errors.Add("Cost code $code has no estimate basis.")
            }

            if ($code -in @(110, 207)) {
                $category = if ($code -eq 110) { 'IDC' } else { 'TDC' }
                if ($description -notmatch '(\d+(?:\.\d+)?)\s*%') {
                    $errors.Add("$category contingency must state a percentage.")
                    continue
                }
                $percentage = [decimal]::Parse($Matches[1], [Globalization.CultureInfo]::InvariantCulture)
                $basisText = $description
                if ($basisColumn -ge 0 -and $basisColumn -lt $row.Count) {
                    $basisText += ' ' + $row[$basisColumn]
                }
                if ($basisText -notmatch '(?i)pre.contingency') {
                    $errors.Add("$category contingency must identify its pre-contingency basis.")
                }
                $categoryTotals[$category] = [PSCustomObject]@{
                    Contingency = $amount
                    Percentage = $percentage
                    Code = $code
                }
            } else {
                $category = if ($code -lt 200) { 'IDC' } else { 'TDC' }
                if (-not $categoryTotals.ContainsKey("${category}Base")) {
                    $categoryTotals["${category}Base"] = [decimal]0
                }
                $categoryTotals["${category}Base"] += $amount

                if ($quantityColumn -ge 0 -and $unitCostColumn -ge 0 -and
                    $quantityColumn -lt $row.Count -and $unitCostColumn -lt $row.Count -and
                    $row[$quantityColumn] -notmatch '(?i)lump\s*sum') {
                    if ($row[$quantityColumn] -match '^\s*([\d,]+(?:\.\d+)?)') {
                        $quantity = [decimal]::Parse(
                            ($Matches[1] -replace ',', ''),
                            [Globalization.CultureInfo]::InvariantCulture
                        )
                        $unitCost = Get-Money $row[$unitCostColumn]
                        if ($null -eq $unitCost) {
                            $errors.Add("Cost code $code has a quantity but no numeric unit cost.")
                        } else {
                            $extended = [decimal]::Round($quantity * $unitCost, 2, [MidpointRounding]::AwayFromZero)
                            if ($extended -ne $amount) {
                                $errors.Add("Cost code $code extension is $amount; quantity times unit cost is $extended.")
                            }
                        }
                    } elseif ($row[$quantityColumn] -match '\d') {
                        $errors.Add("Cost code $code has a malformed quantity.")
                    }
                }
            }
        }
    }

    $expectedCodes = @(101..110) + @(201..207)
    foreach ($code in $expectedCodes) {
        if (-not $seen.ContainsKey($code)) {
            $errors.Add("Required cost code $code is missing.")
        }
    }

    $pending = $pendingCosts.Count -gt 0
    if ($pending -and -not $PermitPending) {
        $errors.Add('Pending cost inputs prevent a fully reconciled AFE.')
    }
    if ($pending -and $PermitPending) {
        if ($Text -notmatch '(?i)pending input|not fully reconciled|cannot be reconciled|unresolved input') {
            $errors.Add('Pending costs must be accompanied by a clear statement that totals are unresolved.')
        }
        if ($Text -match '(?im)^.*grand total.*(?:\$|(?<!\w)\d[\d,]+(?:\.\d{1,2})?).*$') {
            $errors.Add('A numeric grand total must not be presented while cost inputs are pending.')
        }

        $pendingPartnerTable = $tables | Where-Object {
            ($_.Header -join ' ') -match 'Working Interest Owner' -and
            ($_.Header -join ' ') -match 'Net Cost Exposure'
        } | Select-Object -First 1
        if ($null -eq $pendingPartnerTable) {
            $errors.Add('Partner participation table is missing.')
        } else {
            $pendingWiColumn = Find-Column ([string[]]$pendingPartnerTable.Header) 'Working Interest \(%\)'
            $pendingExposureColumn = Find-Column ([string[]]$pendingPartnerTable.Header) 'Net Cost Exposure'
            $pendingInterests = @()
            $allParticipantInterestsNumeric = $true
            foreach ($row in $pendingPartnerTable.Rows) {
                if (($row -join ' ') -match '(?i)\btotal\b') {
                    continue
                }
                if ($pendingWiColumn -ge 0 -and $pendingWiColumn -lt $row.Count -and
                    $row[$pendingWiColumn] -match '(-?\d+(?:\.\d+)?)\s*%') {
                    $interest = [decimal]::Parse($Matches[1], [Globalization.CultureInfo]::InvariantCulture)
                    $pendingInterests += $interest
                    if ($interest -lt 0 -or $interest -gt 100) {
                        $errors.Add('A partner working interest is outside 0–100%.')
                    }
                } else {
                    $allParticipantInterestsNumeric = $false
                }
                if ($pendingWiColumn -lt 0 -or $pendingWiColumn -ge $row.Count -or
                    ($row[$pendingWiColumn] -notmatch '-?\d+(?:\.\d+)?\s*%' -and
                     $row[$pendingWiColumn] -notmatch '(?i)pending|not provided|unknown|\[.*\]')) {
                    $errors.Add('An unknown working interest must remain an explicit placeholder.')
                }
                if ($pendingExposureColumn -lt 0 -or $pendingExposureColumn -ge $row.Count -or
                    $null -ne (Get-Money $row[$pendingExposureColumn])) {
                    $errors.Add('Partner exposure must remain pending when the gross AFE is unresolved.')
                }
            }
            if ($allParticipantInterestsNumeric -and $pendingInterests.Count -gt 0) {
                $pendingInterestTotal = [decimal]0
                foreach ($interest in $pendingInterests) {
                    $pendingInterestTotal += $interest
                }
                if ($pendingInterestTotal -ne 100) {
                    $errors.Add("Working interests total $pendingInterestTotal%; expected 100%.")
                }
            }
        }
    }

    foreach ($category in @('IDC', 'TDC')) {
        if ($pendingCategories.ContainsKey($category)) {
            continue
        }
        if (-not $categoryTotals.ContainsKey($category) -or
            -not $categoryTotals.ContainsKey("${category}Base")) {
            if (-not $pending) {
                $errors.Add("$category subtotal or contingency could not be calculated.")
            }
            continue
        }
        $contingency = $categoryTotals[$category]
        $expectedContingency = [decimal]::Round(
            $categoryTotals["${category}Base"] * $contingency.Percentage / 100,
            2,
            [MidpointRounding]::AwayFromZero
        )
        if ($contingency.Contingency -ne $expectedContingency) {
            $errors.Add("$category contingency is $($contingency.Contingency); expected $expectedContingency.")
        }
    }

    $intangibleSummary = $null
    $tangibleSummary = $null
    $grandTotal = $null
    foreach ($line in $lines) {
        if ($line -match '(?i)Total Intangible Costs') {
            $intangibleSummary = Get-Money $line
        } elseif ($line -match '(?i)Total Tangible Costs') {
            $tangibleSummary = Get-Money $line
        } elseif ($line -match '(?i)Grand Total Estimated AFE Cost') {
            $grandTotal = Get-Money $line
        }
    }

    if (-not $pending) {
        $expectedIdc = $categoryTotals['IDCBase'] + $categoryTotals['IDC'].Contingency
        $expectedTdc = $categoryTotals['TDCBase'] + $categoryTotals['TDC'].Contingency
        $expectedGrand = $expectedIdc + $expectedTdc
        if ($null -eq $intangibleSummary -or $intangibleSummary -ne $expectedIdc) {
            $errors.Add("IDC summary must equal $expectedIdc.")
        }
        if ($null -eq $tangibleSummary -or $tangibleSummary -ne $expectedTdc) {
            $errors.Add("TDC summary must equal $expectedTdc.")
        }
        if ($null -eq $grandTotal -or $grandTotal -ne $expectedGrand) {
            $errors.Add("Grand total must equal IDC plus TDC: $expectedGrand.")
        }

        $partnerTable = $tables | Where-Object {
            ($_.Header -join ' ') -match 'Working Interest Owner' -and
            ($_.Header -join ' ') -match 'Net Cost Exposure'
        } | Select-Object -First 1
        if ($null -eq $partnerTable) {
            $errors.Add('Partner participation table is missing.')
        } else {
            $wiColumn = Find-Column ([string[]]$partnerTable.Header) 'Working Interest \(%\)'
            $exposureColumn = Find-Column ([string[]]$partnerTable.Header) 'Net Cost Exposure'
            $participants = @()
            foreach ($row in $partnerTable.Rows) {
                if (($row -join ' ') -match '(?i)\btotal\b') {
                    continue
                }
                if ($wiColumn -ge 0 -and $wiColumn -lt $row.Count -and
                    $row[$wiColumn] -match '(-?\d+(?:\.\d+)?)\s*%') {
                    $interest = [decimal]::Parse($Matches[1], [Globalization.CultureInfo]::InvariantCulture)
                    $exposure = Get-AmountAt $row $exposureColumn
                    if ($interest -lt 0 -or $interest -gt 100) {
                        $errors.Add('A partner working interest is outside 0–100%.')
                    }
                    if ($null -eq $exposure) {
                        $errors.Add('A participant exposure is missing or pending.')
                    } else {
                        $participants += [PSCustomObject]@{ Interest = $interest; Exposure = $exposure }
                    }
                }
            }
            if ($participants.Count -eq 0) {
                $errors.Add('No numeric working-interest participants were found.')
            } else {
                $interestTotal = [decimal]0
                $exposureTotal = [decimal]0
                foreach ($participant in $participants) {
                    $interestTotal += $participant.Interest
                    $exposureTotal += $participant.Exposure
                    $expectedExposure = [decimal]::Round(
                        $expectedGrand * $participant.Interest / 100,
                        2,
                        [MidpointRounding]::AwayFromZero
                    )
                    if ($participant.Exposure -ne $expectedExposure) {
                        $errors.Add("Partner exposure $($participant.Exposure) does not match the $($participant.Interest)% working interest.")
                    }
                }
                if ($interestTotal -ne 100) {
                    $errors.Add("Working interests total $interestTotal%; expected 100%.")
                }
                if ($exposureTotal -ne $expectedGrand) {
                    $errors.Add("Partner exposures total $exposureTotal; expected $expectedGrand.")
                }
            }
        }
    }

    return [PSCustomObject]@{
        Passed = ($errors.Count -eq 0)
        Pending = $pending
        PendingCosts = @($pendingCosts)
        Errors = @($errors)
    }
}

if ($SelfTest) {
    $fixturePath = Join-Path $PSScriptRoot 'fixtures\afe-valid.md'
    $valid = Get-Content -LiteralPath $fixturePath -Raw

    $validResult = Test-AfeText $valid
    if (-not $validResult.Passed) {
        throw "Valid fixture failed: $($validResult.Errors -join '; ')"
    }
    Write-Output 'PASS: complete fixture reconciles.'

    $brokenContingency = [regex]::Replace(
        $valid,
        '(?m)^(\| 110 \|[^\r\n]*\| )\$133,400\.00',
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($match)
            return $match.Groups[1].Value + '$100.00'
        }
    )
    $brokenResult = Test-AfeText $brokenContingency
    if ($brokenResult.Passed) {
        throw 'Invalid IDC contingency was not detected.'
    }
    Write-Output 'PASS: incorrect contingency is rejected.'

    $invalidInputs = [regex]::Replace(
        $valid,
        '(?m)^(\| 102 \|[^\r\n]*\| )\$800,000\.00',
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($match)
            return $match.Groups[1].Value + '-$40,000.00'
        }
    )
    $invalidInputs = $invalidInputs.Replace(
        '| Test Operator | 60.00% | $1,705,440.00 | Not provided |',
        '| Test Operator | 60.00% | Pending input | Not provided |'
    )
    $invalidInputs = $invalidInputs.Replace(
        '| Test Partner | 40.00% | $1,136,960.00 | Not provided |',
        '| Test Partner | 30.00% | Pending input | Not provided |'
    )
    $invalidInputs = $invalidInputs.Replace(
        '| **Total** | **100.00%** | **$2,842,400.00** | |',
        '| **Total** | **90.00%** | **Pending input** | |'
    )
    $invalidInputs = $invalidInputs.Replace(
        '| 206 | Surface Production Facilities & Storage Tanks | Lump Sum | - | $300,000.00 | User-provided |',
        '| 206 | Surface Production Facilities & Storage Tanks | Lump Sum | - | Pending input | Pending input |'
    )
    $invalidInputs = $invalidInputs.Replace(
        '- **GRAND TOTAL ESTIMATED AFE COST:** **$2,842,400.00**',
        '- **GRAND TOTAL ESTIMATED AFE COST:** Pending input; not fully reconciled.'
    )
    $invalidResult = Test-AfeText $invalidInputs -PermitPending
    $invalidErrors = $invalidResult.Errors -join '; '
    if ($invalidResult.Passed -or
        $invalidErrors -notmatch 'negative gross amount' -or
        $invalidErrors -notmatch 'Working interests total 90(?:\.00)?%' -or
        -not $invalidResult.Pending -or
        $invalidResult.PendingCosts -notcontains 'Cost code 206') {
        throw "Invalid costs and interests were not all detected (pending=$($invalidResult.Pending); pending codes=$($invalidResult.PendingCosts -join ', ')): $invalidErrors"
    }
    Write-Output 'PASS: negative costs and non-100% working interests are rejected.'

    $pending = [regex]::Replace(
        $valid,
        '(?m)^(\| 206 \|[^\r\n]*\| )\$300,000\.00',
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($match)
            return $match.Groups[1].Value + 'Pending input'
        }
    )
    $pending = $pending.Replace(
        '- **GRAND TOTAL ESTIMATED AFE COST:** **$2,842,400.00**',
        '- **GRAND TOTAL ESTIMATED AFE COST:** Pending input; not fully reconciled.'
    )
    $pending = $pending.Replace(
        '| Test Operator | 60.00% | $1,705,440.00 | Not provided |',
        '| Test Operator | 60.00% | Pending input | Not provided |'
    )
    $pending = $pending.Replace(
        '| Test Partner | 40.00% | $1,136,960.00 | Not provided |',
        '| Test Partner | 40.00% | Pending input | Not provided |'
    )
    $pending = $pending.Replace(
        '| **Total** | **100.00%** | **$2,842,400.00** | |',
        '| **Total** | **100.00%** | **Pending input** | |'
    )
    $pendingResult = Test-AfeText $pending -PermitPending
    if (-not $pendingResult.Passed -or -not $pendingResult.Pending) {
        throw "Explicit pending input was not handled safely: $($pendingResult.Errors -join '; ')"
    }

    $falseTotal = $pending.Replace(
        '- **GRAND TOTAL ESTIMATED AFE COST:** Pending input; not fully reconciled.',
        '- **GRAND TOTAL ESTIMATED AFE COST:** $2,542,400.00'
    )
    $falseTotalResult = Test-AfeText $falseTotal -PermitPending
    if ($falseTotalResult.Passed) {
        throw 'Numeric grand total with pending cost was not rejected.'
    }
    Write-Output 'PASS: pending costs require an unresolved total; a numeric grand total is rejected.'
    Write-Output 'Self-test passed.'
    exit 0
}

if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "AFE Markdown file not found: $Path"
}

$document = Get-Content -LiteralPath $Path -Raw
$result = Test-AfeText $document -PermitPending:$AllowPendingInputs
if ($result.Passed) {
    if ($result.Pending) {
        Write-Output 'PASS: required structure is present; pending costs are clearly unresolved and no numeric grand total is claimed.'
    } else {
        Write-Output 'PASS: AFE structure, cost extensions, contingencies, summary totals, and partner exposures reconcile.'
    }
    exit 0
}

foreach ($errorMessage in $result.Errors) {
    Write-Error $errorMessage -ErrorAction Continue
}
exit 1

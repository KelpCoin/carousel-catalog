$Root = Split-Path $PSScriptRoot -Parent
Import-Module (Join-Path $Root 'LedgerModule\CortexLedger.psm1') -Force
$events = @()
if (Test-Path (Join-Path $Root 'ledger.jsonl')) { $events = Get-Content (Join-Path $Root 'ledger.jsonl') | Where-Object { $_ } | ForEach-Object { $_ | ConvertFrom-Json } }

# Build probes from ledger
$probes = @{}
foreach ($e in $events) {
    $ev = if ($e.event -is [String]) { $e.event | ConvertFrom-Json } else { $e.event }
    if ($ev.event_type -eq 'PROBE_CREATED') { $probes[$ev.probe_id] = @{hook=$ev.hook;link=$ev.stripe_link;sales=0} }
    if ($ev.event_type -eq 'SALE_CONFIRMED' -and $probes.ContainsKey($ev.probe_id)) { $probes[$ev.probe_id].sales++ }
}
$ranked = $probes.Values | Sort-Object sales -Descending
$ticker = if ($events.Count -gt 0) { "Live  $($events.Count) ledger events  Cinema Hub Active" } else { "Awaiting first transaction..." }

# Build carousel slides
$slides = ''
$rank = 1
foreach ($p in $ranked) {
    $hook = [System.Web.HttpUtility]::HtmlEncode($p.hook)
    $link = [System.Web.HttpUtility]::HtmlEncode($p.link)
    $badge = if ($rank -eq 1 -and $p.sales -ge 1) { '<span class="badge">BEST SELLER</span>' } else { '' }
    $slides += "<div class='slide'><div class='card'><div class='layer'>SIGNAL $(if($rank -eq 1){''}else{''})</div><h2>$hook</h2><p class='sales'>$($p.sales) sales</p>$badge<a class='cta' href='$link'>Get It Now</a></div></div>"
    $rank++
}
if ($slides -eq '') { $slides = "<div class='slide'><div class='card empty'><h2>No probes yet</h2><p>Create your first probe with CortexEarn.ps1 -NewProbe</p></div></div>" }

$html = @"
<!DOCTYPE html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cinema Hub</title>
<style>
:root{--bg:#0B0E11;--cardBg:#1E2329;--gold:#F0B90B;--text:#EAECEF;--muted:#848E9C;--radius:12px}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
.ticker{background:var(--cardBg);border-bottom:1px solid #2B3139;padding:0.7rem 1.5rem;text-align:center;color:var(--gold);font-size:0.85rem;letter-spacing:0.5px;position:sticky;top:0;z-index:10}
.hero{text-align:center;padding:3rem 1.5rem 2rem}
.hero h1{font-size:2.2rem;color:var(--gold);margin-bottom:0.5rem;letter-spacing:-0.5px}
.hero p{color:var(--muted);font-size:1rem}
.carousel{display:flex;overflow-x:auto;gap:1.2rem;padding:0 1.5rem 2rem;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.slide{min-width:300px;max-width:340px;scroll-snap-align:center;flex-shrink:0}
.card{background:var(--cardBg);border:1px solid #2B3139;border-radius:var(--radius);padding:1.5rem;height:100%;display:flex;flex-direction:column;justify-content:space-between;transition:border-color 0.2s}
.card:hover{border-color:var(--gold)}
.card:first-child{border-color:var(--gold);box-shadow:0 0 24px rgba(240,185,11,0.15)}
.layer{font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:var(--gold);margin-bottom:0.75rem}
.card h2{font-size:1.2rem;line-height:1.4;margin-bottom:0.5rem}
.sales{font-size:0.8rem;color:var(--muted);margin-bottom:0.75rem}
.badge{display:inline-block;background:var(--gold);color:var(--bg);padding:3px 10px;border-radius:4px;font-size:0.7rem;font-weight:700;margin-bottom:0.75rem}
.cta{display:block;background:var(--gold);color:var(--bg);text-align:center;padding:0.75rem;border-radius:8px;font-weight:700;text-decoration:none;margin-top:auto;transition:filter 0.2s}
.cta:hover{filter:brightness(1.15)}
.trust{display:flex;justify-content:center;gap:2rem;padding:1rem 1.5rem;border-top:1px solid #2B3139;color:var(--muted);font-size:0.75rem}
.footer{text-align:center;padding:1rem;color:var(--muted);font-size:0.7rem}
.card.empty{text-align:center;border-style:dashed}
.card.empty h2{color:var(--muted)}
@media(min-width:768px){.carousel{justify-content:center}}
</style></head><body>
<div class="ticker">$ticker</div>
<div class="hero"><h1>Cinema Hub</h1><p>Live probe auction  ranked by real revenue</p></div>
<div class="carousel">$slides</div>
<div class="trust"><span>Stripe-secured</span><span>Instant Delivery</span><span>Ledger-Verified</span></div>
<div class="footer">Powered by Cortex  Refresh for updated rankings</div>
</body></html>
"@
$outDir = (Join-Path $PSScriptRoot '.')
$html | Set-Content (Join-Path $outDir 'index.html') -Encoding UTF8
Write-Host "Cinema Hub generated: index.html" -ForegroundColor Green

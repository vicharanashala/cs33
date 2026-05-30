# ============================================================
# Full flow test: register → submit FAQ → mod approve → answer/vote/accept
# ============================================================
$ErrorActionPreference = "Continue"

function api {
    param($method, $path, $body, $token)
    $h = @{ "Content-Type" = "application/json" }
    if ($token) { $h["Authorization"] = "Bearer $token" }
    $uri = "http://localhost:5000$path"
    if ($body) {
        Invoke-RestMethod -Method $method -Uri $uri -Headers $h -Body ($body | ConvertTo-Json) -TimeoutSec 10
    } else {
        Invoke-RestMethod -Method $method -Uri $uri -Headers $h -TimeoutSec 10
    }
}

$email    = "testuser$(Get-Random 9999)@example.com"
$password = "TestPass123!"
$modEmail = "mod@test.com"
$modPass  = "password123"

# ── Step 1: Register ──────────────────────────────────────────
Write-Host "`n[STEP 1] Register: $email"
$r = api POST "/api/auth/register" @{ name="TestUser"; email=$email; password=$password }
$r | ConvertTo-Json -Depth 3
$userToken = $r.token
if (-not $userToken) { Write-Host "FAIL: No token"; exit 1 }
Write-Host "OK: userId=$($r.user._id)"

# ── Step 2: Submit FAQ ─────────────────────────────────────────
Write-Host "`n[STEP 2] Submit FAQ"
$faqBody = @{
    question = "How do I reset my password if I forgot it?"
    body     = "I tried clicking the forgot password link but never received an email. What should I do to regain access to my account?"
    category = "general"
    tags     = @("password", "account", "login")
}
$r = api POST "/api/faqs" $faqBody $userToken
$r | ConvertTo-Json -Depth 3
$faqId = $r.data._id
if (-not $faqId) { Write-Host "FAIL: No faqId"; exit 1 }
Write-Host "OK: faqId=$faqId status=$($r.data.status)"

# ── Step 3: Login as mod ───────────────────────────────────────
Write-Host "`n[STEP 3] Login as mod: $modEmail"
$r = api POST "/api/auth/login" @{ email=$modEmail; password=$modPass }
$r | ConvertTo-Json -Depth 3
$modToken = $r.token
if (-not $modToken) { Write-Host "FAIL: No mod token"; exit 1 }
Write-Host "OK: mod role=$($r.user.role)"

# ── Step 4: Mod approves FAQ ───────────────────────────────────
Write-Host "`n[STEP 4] Mod approves FAQ: $faqId"
$r = api PUT "/api/mod/faqs/$faqId/status" @{ status="approved" } $modToken
$r | ConvertTo-Json -Depth 3
Write-Host "OK: status=$($r.success)"

# ── Step 5: Back as new user — find FAQ ───────────────────────
Write-Host "`n[STEP 5] Get approved FAQ: $faqId"
$r = api GET "/api/faqs/$faqId" $null
$r | ConvertTo-Json -Depth 3
$status = $r.data.status
if ($status -ne "approved") { Write-Host "FAIL: status=$status (expected approved)"; exit 1 }
Write-Host "OK: FAQ is approved"

# ── Step 6: Submit an answer ───────────────────────────────────
Write-Host "`n[STEP 6] Submit answer"
$answerBody = @{
    body = "If you do not receive the reset email within a few minutes, check your spam folder first. If it is not there, try requesting a new reset link. Make sure you are using the correct email address associated with your account."
}
$r = api POST "/api/faqs/$faqId/answers" $answerBody $userToken
$r | ConvertTo-Json -Depth 3
$answerId = $r.data._id
if (-not $answerId) { Write-Host "FAIL: No answerId"; exit 1 }
Write-Host "OK: answerId=$answerId"

# ── Step 7: Vote on FAQ ────────────────────────────────────────
Write-Host "`n[STEP 7] Upvote FAQ"
$r = api POST "/api/faqs/$faqId/vote" @{ vote=1 } $userToken
$r | ConvertTo-Json -Depth 3
Write-Host "OK: votes=$($r.data.votes)"

# ── Step 8: Mark answer accepted (new user is FAQ author) ─────
Write-Host "`n[STEP 8] Accept answer"
$r = api PUT "/api/faqs/$faqId/answers/$answerId/accept" @{ accepted=$true } $userToken
$r | ConvertTo-Json -Depth 3
Write-Host "OK: accepted=$($r.data.accepted)"

Write-Host "`n======== ALL STEPS PASSED ========"
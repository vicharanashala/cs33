$body = @{ name="TestUser"; email="testuser$(Get-Random 9999)@example.com"; password="TestPass123!" } | ConvertTo-Json
try {
    $r = Invoke-RestMethod http://localhost:5000/api/auth/register -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 10
    $token = if ($r.token) { $r.token.Substring(0,20) + "..." } else { "NO TOKEN" }
    "SUCCESS: $($r.user.name) | token: $token"
} catch {
    $ex = $_ | ConvertTo-Json -Depth 2
    "FAIL: $ex"
}
# Get fresh token
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post `
  -Body (@{ email = "admin@test.com"; password = "password123" } | ConvertTo-Json) `
  -ContentType "application/json"
$token = $login.token
Write-Host "Token obtained: $($token.Substring(0, 20))..."
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "`n=== TEST 1: GET /api/admin/stats ==="
try { $r = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/stats" -Headers $h; Write-Host "OK - totalUsers: $($r.data.totalUsers)" } catch { Write-Host "FAIL: $($_.Exception.Response.StatusCode.value__) - $($_.ErrorDetails.Message)" }

Write-Host "`n=== TEST 2: GET /api/admin/users ==="
try { $r = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users?page=1&limit=5" -Headers $h; Write-Host "OK - count: $($r.data.Count)"; $r.data | ForEach-Object { Write-Host "  $($_.name) | $($_.role)" } } catch { Write-Host "FAIL: $($_.Exception.Response.StatusCode.value__) - $($_.ErrorDetails.Message)" }

Write-Host "`n=== TEST 3: GET /api/admin/dashboard ==="
try { $r = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/dashboard" -Headers $h; Write-Host "OK" } catch { Write-Host "FAIL: $($_.Exception.Response.StatusCode.value__) - $($_.ErrorDetails.Message)" }

Write-Host "`n=== TEST 4: GET /api/admin/faqs ==="
try { $r = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/faqs?limit=3" -Headers $h; Write-Host "OK - count: $($r.data.Count)" } catch { Write-Host "FAIL: $($_.Exception.Response.StatusCode.value__) - $($_.ErrorDetails.Message)" }
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/' -UseBasicParsing -TimeoutSec 15
    Write-Output "Status: $($r.StatusCode)"
    Write-Output "Length: $($r.Content.Length)"
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}

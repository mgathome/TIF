# Push d'un correctif vers GitHub - Railway redeploiera tout seul

$ErrorActionPreference = "Continue"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Push du correctif vers GitHub" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Nettoyer un eventuel lock Git
if (Test-Path ".git\index.lock") {
    Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
    Write-Host "[OK] Lock Git nettoye" -ForegroundColor Yellow
}

Write-Host "[1/3] Ajout des fichiers modifies..." -ForegroundColor Yellow
git add -A

Write-Host "[2/3] Creation du commit..." -ForegroundColor Yellow
git commit -m "fix: cast explicite enum order_status pour PATCH /orders/:id/status"

Write-Host "[3/3] Push vers GitHub..." -ForegroundColor Green
git push

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "  SUCCES ! Code pousse." -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Railway va redeployer dans 1-2 minutes." -ForegroundColor Cyan
    Write-Host "Vous pouvez suivre sur railway.app -> votre projet -> Deployments" -ForegroundColor Cyan
} else {
    Write-Host "Erreur lors du push - envoyez le message a Claude" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur Entree pour fermer."
Read-Host

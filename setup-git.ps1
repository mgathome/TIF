# =====================================================================
# TIF — Script d'initialisation Git + push vers GitHub
# =====================================================================
# Lance avec PowerShell : clic droit sur le fichier > "Executer avec PowerShell"
# OU dans PowerShell :
#   cd "C:\Users\gweno\Documents\MG AT HOME\Claude Workspace\TYF\TIF"
#   .\setup-git.ps1

$ErrorActionPreference = "Continue"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  TIF - Setup Git et push vers GitHub" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Nettoyer un eventuel .git foireux
if (Test-Path ".git") {
    Write-Host "[1/7] Nettoyage de l'ancien .git..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".git" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# 2. Nettoyer node_modules si presents
foreach ($dir in @("backend\node_modules", "frontend\node_modules")) {
    if (Test-Path $dir) {
        Write-Host "[2/7] Suppression de $dir..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# 3. Init
Write-Host "[3/7] Initialisation du repo Git..." -ForegroundColor Yellow
git init | Out-Null

# 4. Configurer l'identite (locale au repo, ne touche pas votre config globale)
Write-Host "[4/7] Configuration de l'identite Git..." -ForegroundColor Yellow
git config user.name "Gwenolien"
git config user.email "mgathomeconciergerie@gmail.com"

# 5. Add + Commit
Write-Host "[5/7] Ajout des fichiers..." -ForegroundColor Yellow
git add .
Write-Host "[5/7] Creation du commit..." -ForegroundColor Yellow
git commit -m "Initial commit - TIF MVP" --quiet
git branch -M main

# 6. Remote
Write-Host "[6/7] Connexion au repo GitHub..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/mgathome/tif.git

# 7. Push
Write-Host "[7/7] Push vers GitHub..." -ForegroundColor Green
Write-Host ""
Write-Host "  >> Une fenetre va peut-etre s'ouvrir pour vous authentifier" -ForegroundColor Magenta
Write-Host "  >> Cliquez 'Sign in with your browser' puis 'Authorize'" -ForegroundColor Magenta
Write-Host ""
git push -u origin main

# Resultat
Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "  SUCCES ! Code pousse sur GitHub" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifiez ici : https://github.com/mgathome/tif" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Etape suivante : creer la base Neon."
} else {
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host "  Erreur lors du push" -ForegroundColor Red
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Copiez le message d'erreur ci-dessus et envoyez-le a Claude."
}

Write-Host ""
Write-Host "Appuyez sur Entree pour fermer cette fenetre."
Read-Host

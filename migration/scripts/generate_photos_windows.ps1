$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
python -m pip install -r requirements.txt Pillow
if ($LASTEXITCODE -ne 0) { throw 'Could not install Python dependencies.' }
$secret = Read-Host 'Paste your OpenAI API key (it will not be displayed)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    $env:RECIPE_IMAGE_MONTHLY_LIMIT = '470'
    $env:RECIPE_IMAGE_QUALITY = 'medium'
    python scripts/batch_recipe_photos.py --execute --max-new 470
    if ($LASTEXITCODE -ne 0) { throw 'Photo generation stopped. See the error above.' }
} finally {
    Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:RECIPE_IMAGE_MONTHLY_LIMIT -ErrorAction SilentlyContinue
    Remove-Item Env:RECIPE_IMAGE_QUALITY -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
Write-Host 'Review images in public/recipe-images, then commit and push them with GitHub Desktop.'

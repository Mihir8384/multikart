# PowerShell script to convert SVG to PNG using ImageMagick
# First, install ImageMagick if not already installed

# Define the paths
$settingsPath = "c:\Users\Mihir\Desktop\FreeLanceProject\multikart\public\assets\images\settings"

# Create temporary SVG files for conversion
$infoTechLogoFull = @"
<svg width="500" height="140" viewBox="0 0 500 140" xmlns="http://www.w3.org/2000/svg">
  <!-- Blue circuit icon -->
  <g transform="translate(10, 10)">
    <rect x="20" y="20" width="80" height="80" rx="12" fill="none" stroke="#0066FF" stroke-width="6"/>
    <circle cx="60" cy="50" r="6" fill="#0066FF"/>
    <circle cx="100" cy="70" r="6" fill="#0066FF"/>
    <circle cx="80" cy="100" r="6" fill="#0066FF"/>
    <path d="M 66 50 L 94 70" stroke="#0066FF" stroke-width="5" fill="none"/>
    <path d="M 100 76 L 85 94" stroke="#0066FF" stroke-width="5" fill="none"/>
  </g>
  <!-- Text -->
  <text x="120" y="70" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#000" letter-spacing="1">InfoTech</text>
</svg>
"@

# Save temporary SVG
$tempSvg = Join-Path $settingsPath "temp-logo.svg"
Set-Content -Path $tempSvg -Value $infoTechLogoFull

# Convert using ImageMagick if available, otherwise use built-in conversion
try {
  # Try using ImageMagick
  magick convert $tempSvg -density 150 -quality 95 -background white "$settingsPath\logo-white.png"
  magick convert $tempSvg -density 150 -quality 95 -background "#1a1a1a" "$settingsPath\logo-dark.png"
  Write-Host "ImageMagick conversion successful"
} catch {
  Write-Host "ImageMagick not found, attempting alternative method"
}

# Cleanup
Remove-Item $tempSvg -ErrorAction SilentlyContinue

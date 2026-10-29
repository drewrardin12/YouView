"""Generate the manifest-free Apple Home Screen entry from the main app."""
from pathlib import Path
root = Path(__file__).resolve().parent
source = (root / "index.html").read_text()
source = source.replace('<link rel="manifest" href="./manifest.webmanifest">', '')
source = source.replace('width=device-width,initial-scale=1,viewport-fit=cover', 'width=device-width,initial-scale=1')
source = source.replace('<meta name="apple-mobile-web-app-title" content="YouView">', '<meta name="apple-mobile-web-app-title" content="YouView iPhone"><meta name="apple-mobile-web-app-status-bar-style" content="black">')
(root / "iphone.html").write_text(source)

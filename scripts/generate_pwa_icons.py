import os
import subprocess
from PIL import Image

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")
TEMP_DIR = os.path.join(PROJECT_ROOT, ".temp_icons")
os.makedirs(TEMP_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Standard SVG (Badge with transparent background)
STANDARD_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" fill="#249144" />
  <circle cx="50" cy="50" r="38" fill="#14532d" />
  <path d="M50 20 L58 38 L78 40 L63 54 L68 74 L50 63 L32 74 L37 54 L22 40 L42 38 Z" fill="#86c498" opacity="0.3" />
  <path d="M50 24 C52 38 68 44 68 56 C68 66 60 74 50 74 C40 74 32 66 32 56 C32 44 48 38 50 24 Z" fill="#ffffff" />
  <circle cx="50" cy="56" r="6" fill="#249144" />
  <path d="M26 50 Q18 50 18 42" stroke="#d1ead4" stroke-width="3" stroke-linecap="round" fill="none" />
  <path d="M74 50 Q82 50 82 42" stroke="#d1ead4" stroke-width="3" stroke-linecap="round" fill="none" />
</svg>"""

# Maskable SVG (Full bleed brand background with motif contained in 80% safe zone)
MASKABLE_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#249144" />
  <circle cx="50" cy="50" r="38" fill="#14532d" />
  <path d="M50 20 L58 38 L78 40 L63 54 L68 74 L50 63 L32 74 L37 54 L22 40 L42 38 Z" fill="#86c498" opacity="0.3" />
  <path d="M50 24 C52 38 68 44 68 56 C68 66 60 74 50 74 C40 74 32 66 32 56 C32 44 48 38 50 24 Z" fill="#ffffff" />
  <circle cx="50" cy="56" r="6" fill="#249144" />
  <path d="M26 50 Q18 50 18 42" stroke="#d1ead4" stroke-width="3" stroke-linecap="round" fill="none" />
  <path d="M74 50 Q82 50 82 42" stroke="#d1ead4" stroke-width="3" stroke-linecap="round" fill="none" />
</svg>"""

def render_svg(svg_content, output_path, size=512, transparent=True):
    bg_style = "background: transparent;" if transparent else "background: #249144;"
    bg_arg = "--default-background-color=00000000" if transparent else "--default-background-color=ff249144"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* {{ margin: 0; padding: 0; }}
html, body {{ width: {size}px; height: {size}px; overflow: hidden; {bg_style} }}
svg {{ width: {size}px; height: {size}px; display: block; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>"""

    temp_html = os.path.join(TEMP_DIR, f"render_{size}_{'trans' if transparent else 'solid'}.html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        bg_arg,
        "--hide-scrollbars",
        f"--window-size={size},{size}",
        f"--screenshot={output_path}",
        temp_html
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not os.path.exists(output_path):
        raise RuntimeError(f"Error rendering {output_path}: {res.stderr}")
    print(f"Rendered: {output_path} ({size}x{size})")

def main():
    # 1. Master 512x512 renders
    master_std = os.path.join(TEMP_DIR, "master_std_512.png")
    master_mask = os.path.join(TEMP_DIR, "master_mask_512.png")

    render_svg(STANDARD_SVG, master_std, size=512, transparent=True)
    render_svg(MASKABLE_SVG, master_mask, size=512, transparent=False)

    img_std_512 = Image.open(master_std)
    img_mask_512 = Image.open(master_mask)

    # 2. Save public/icon-512.png
    dest_512 = os.path.join(PUBLIC_DIR, "icon-512.png")
    img_std_512.save(dest_512, "PNG")
    print(f"Saved: {dest_512}")

    # 3. Save public/icon-192.png
    dest_192 = os.path.join(PUBLIC_DIR, "icon-192.png")
    img_std_192 = img_std_512.resize((192, 192), Image.Resampling.LANCZOS)
    img_std_192.save(dest_192, "PNG")
    print(f"Saved: {dest_192}")

    # 4. Save public/icon-maskable-512.png
    dest_mask_512 = os.path.join(PUBLIC_DIR, "icon-maskable-512.png")
    img_mask_512.save(dest_mask_512, "PNG")
    print(f"Saved: {dest_mask_512}")

    # 5. Save public/icon-maskable-192.png
    dest_mask_192 = os.path.join(PUBLIC_DIR, "icon-maskable-192.png")
    img_mask_192 = img_mask_512.resize((192, 192), Image.Resampling.LANCZOS)
    img_mask_192.save(dest_mask_192, "PNG")
    print(f"Saved: {dest_mask_192}")

    # 6. Save public/apple-touch-icon.png (180x180)
    dest_apple = os.path.join(PUBLIC_DIR, "apple-touch-icon.png")
    img_apple = img_mask_512.resize((180, 180), Image.Resampling.LANCZOS)
    img_apple.save(dest_apple, "PNG")
    print(f"Saved: {dest_apple}")

    # Cleanup temp
    for f in os.listdir(TEMP_DIR):
        os.remove(os.path.join(TEMP_DIR, f))
    os.rmdir(TEMP_DIR)
    print("Done generating all PWA and Mobile icons!")

if __name__ == "__main__":
    main()

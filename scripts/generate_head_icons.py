import os
from PIL import Image

src_path = r'C:\Users\Abdul\.gemini\antigravity\brain\9b9206b7-9351-4a4e-81a7-946ea1a6a7f1\.user_uploaded\media_1793423246834_bae049b0.png'
dest_dir = r'C:\Users\Abdul\Documents\EDUCO_LMS\public'

orig = Image.open(src_path).convert('RGBA')

# 1. Precise transparent background removal
# The image has white background ~ (253, 253, 255)
# Foreground colors:
# Red: R ~ 219, G ~ 4, B ~ 37
# Blue: R ~ 3, G ~ 54, B ~ 127
clean = Image.new('RGBA', orig.size, (0, 0, 0, 0))
orig_pixels = orig.load()
clean_pixels = clean.load()

for y in range(orig.height):
    for x in range(orig.width):
        r, g, b, a = orig_pixels[x, y]
        # Check distance from white (255, 255, 255)
        # In white bg, min(r, g, b) > 240
        min_c = min(r, g, b)
        max_c = max(r, g, b)
        diff = max_c - min_c
        
        if min_c >= 248 and diff < 12:
            # Pure background
            clean_pixels[x, y] = (0, 0, 0, 0)
        elif min_c > 220 and diff < 25:
            # Transition edge to white
            alpha = int(255 * (1.0 - (min_c - 220) / 28.0))
            alpha = max(0, min(255, alpha))
            # Determine if this edge is red or blue
            if r > b:
                # Red edge
                clean_pixels[x, y] = (227, 26, 40, alpha)
            else:
                # Blue edge
                clean_pixels[x, y] = (0, 52, 120, alpha)
        else:
            # Solid foreground or colored anti-aliased edge
            # If slightly tinted by white, unblend with white background
            # unblend: C_fg = (C - (1-alpha)*255) / alpha
            # For solid pixels, keep original
            clean_pixels[x, y] = (r, g, b, 255)

# 2. Crop to exact bounds
bbox = clean.getbbox()
print('Cleaned bbox:', bbox)
emblem = clean.crop(bbox)
print('Emblem size:', emblem.size)

# 3. Create a perfect 512x512 square icon with safe padding
# Width: ~540, Height: ~500 -> Scale to fit in 440x440 inside 512x512 canvas
canvas_512 = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
scale = 440.0 / max(emblem.width, emblem.height)
new_w = int(emblem.width * scale)
new_h = int(emblem.height * scale)
emblem_resized = emblem.resize((new_w, new_h), Image.Resampling.LANCZOS)
pos_x = (512 - new_w) // 2
pos_y = (512 - new_h) // 2
canvas_512.paste(emblem_resized, (pos_x, pos_y), emblem_resized)

# Save educo-mark.png (512x512 transparent)
canvas_512.save(os.path.join(dest_dir, 'educo-mark.png'), 'PNG', optimize=True)
print('Saved educo-mark.png (512x512 transparent)')

# 4. Generate educo-mark-white.png for dark mode (Blue 'u' becomes pure white, Red stays red)
mark_white = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
c_pixels = canvas_512.load()
w_pixels = mark_white.load()

for y in range(512):
    for x in range(512):
        r, g, b, a = c_pixels[x, y]
        if a > 0:
            if r > 130 and r > (g + 30) and r > (b + 30):
                # Red head / wings
                w_pixels[x, y] = (r, g, b, a)
            else:
                # Blue 'u' -> white
                w_pixels[x, y] = (255, 255, 255, a)

mark_white.save(os.path.join(dest_dir, 'educo-mark-white.png'), 'PNG', optimize=True)
print('Saved educo-mark-white.png (512x512 transparent)')

# 5. Generate Favicons: 16x16, 32x32, 48x48, 64x64
fav16 = canvas_512.resize((16, 16), Image.Resampling.LANCZOS)
fav16.save(os.path.join(dest_dir, 'favicon-16x16.png'), 'PNG', optimize=True)

fav32 = canvas_512.resize((32, 32), Image.Resampling.LANCZOS)
fav32.save(os.path.join(dest_dir, 'favicon-32x32.png'), 'PNG', optimize=True)

fav48 = canvas_512.resize((48, 48), Image.Resampling.LANCZOS)
fav64 = canvas_512.resize((64, 64), Image.Resampling.LANCZOS)

ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
fav16.save(os.path.join(dest_dir, 'favicon.ico'), format='ICO', sizes=ico_sizes)
print('Saved favicon.ico with sizes [16, 32, 48, 64]')

# 6. Generate apple-touch-icon.png (180x180, white background with safe padding)
apple_icon = Image.new('RGBA', (180, 180), (255, 255, 255, 255))
emblem_apple = canvas_512.resize((150, 150), Image.Resampling.LANCZOS)
apple_icon.paste(emblem_apple, (15, 15), emblem_apple)
apple_icon.save(os.path.join(dest_dir, 'apple-touch-icon.png'), 'PNG', optimize=True)
print('Saved apple-touch-icon.png (180x180)')

# 7. Update favicon.svg with this official emblem embedded in high resolution
import base64
with open(os.path.join(dest_dir, 'educo-mark.png'), 'rb') as f:
    b64_mark = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64_mark}" x="0" y="0" width="512" height="512"/>
</svg>'''

with open(os.path.join(dest_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_content)
print('Saved favicon.svg (512x512 with embedded mark)')

print('All head assets successfully generated!')

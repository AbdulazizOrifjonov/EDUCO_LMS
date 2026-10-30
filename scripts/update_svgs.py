import base64
import os

dest_dir = r'C:\Users\Abdul\Documents\EDUCO_LMS\public'

with open(os.path.join(dest_dir, 'educo-logo-512.png'), 'rb') as f:
    b64_512 = base64.b64encode(f.read()).decode('utf-8')

with open(os.path.join(dest_dir, 'educo-logo.png'), 'rb') as f:
    b64_logo = base64.b64encode(f.read()).decode('utf-8')

fav_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#FFFFFF"/>
  <image href="data:image/png;base64,{b64_512}" x="0" y="0" width="512" height="512"/>
</svg>'''

with open(os.path.join(dest_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
    f.write(fav_svg)

logo_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1008 316" width="1008" height="316">
  <image href="data:image/png;base64,{b64_logo}" x="0" y="0" width="1008" height="316"/>
</svg>'''

with open(os.path.join(dest_dir, 'educo-logo.svg'), 'w', encoding='utf-8') as f:
    f.write(logo_svg)

print('Updated favicon.svg and educo-logo.svg successfully!')

from PIL import Image, ImageChops
import os

def process_logo(input_path, output_path):
    # Open the image
    img = Image.open(input_path).convert("RGBA")
    
    # Get the data
    datas = img.getdata()
    
    new_data = []
    # Threshold for "white-ish" background
    # We want to remove the white background and also the subtle light-grey container if possible
    # Most of the background is > 240
    for item in datas:
        # If it's very light (nearly white), make it transparent
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Auto-crop to the icon content
    # Find bounding box of non-transparent areas
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Logo processed and saved to {output_path}")

try:
    # Source image from the artifact path
    artifact_path = "C:/Users/GN/.gemini/antigravity/brain/0d22a028-473f-4215-a5e9-5e436c990c65/logo_v3_clean_finance_1768240931778.png"
    target_path = "d:/meu-contador/public/icon.png"
    
    if os.path.exists(artifact_path):
        process_logo(artifact_path, target_path)
    else:
        print(f"Artifact not found at {artifact_path}")
except Exception as e:
    print(f"Error: {e}")

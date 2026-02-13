"""Generate icon files for IT Monitor Agent tray icon."""
from PIL import Image, ImageDraw, ImageFont

def create_icon(color, filename, size=64):
    """Create a simple IT monitor icon."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background
    draw.rounded_rectangle([2, 2, size - 2, size - 2], radius=12, fill=color)

    # Draw "IT" text
    try:
        font = ImageFont.truetype("arial.ttf", int(size * 0.44))
    except (OSError, IOError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "IT", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2
    y = (size - text_h) // 2 - 2
    draw.text((x, y), "IT", fill="white", font=font)

    return img


if __name__ == "__main__":
    sizes = [16, 32, 48, 64, 128, 256]

    # Green icon (normal/running)
    green_imgs = [create_icon("#22c55e", "green", s) for s in sizes]
    green_imgs[0].save("icon_green.ico", format="ICO", sizes=[(s, s) for s in sizes],
                       append_images=green_imgs[1:])
    print("Created icon_green.ico")

    # Yellow icon (warning/offline)
    yellow_imgs = [create_icon("#eab308", "yellow", s) for s in sizes]
    yellow_imgs[0].save("icon_yellow.ico", format="ICO", sizes=[(s, s) for s in sizes],
                        append_images=yellow_imgs[1:])
    print("Created icon_yellow.ico")

    # Red icon (error)
    red_imgs = [create_icon("#ef4444", "red", s) for s in sizes]
    red_imgs[0].save("icon_red.ico", format="ICO", sizes=[(s, s) for s in sizes],
                     append_images=red_imgs[1:])
    print("Created icon_red.ico")

    # Gray icon (stopped)
    gray_imgs = [create_icon("#6b7280", "gray", s) for s in sizes]
    gray_imgs[0].save("icon_gray.ico", format="ICO", sizes=[(s, s) for s in sizes],
                      append_images=gray_imgs[1:])
    print("Created icon_gray.ico")

    # Default icon (same as green, used for .exe icon)
    green_imgs[0].save("icon.ico", format="ICO", sizes=[(s, s) for s in sizes],
                       append_images=green_imgs[1:])
    print("Created icon.ico (default)")

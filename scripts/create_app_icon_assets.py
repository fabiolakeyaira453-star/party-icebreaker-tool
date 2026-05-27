import math
import os
import struct
import zlib

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ICON_DIR = os.path.join(ROOT, "public", "icons")
PUBLIC_DIR = os.path.join(ROOT, "public")
TEAL = (18, 154, 135, 255)
WHITE = (255, 255, 255, 255)


def over(base, top):
    alpha = top[3] / 255
    out_alpha = alpha + base[3] / 255 * (1 - alpha)
    if out_alpha == 0:
        return (0, 0, 0, 0)
    rgb = []
    for i in range(3):
        value = (top[i] * alpha + base[i] * (base[3] / 255) * (1 - alpha)) / out_alpha
        rgb.append(round(value))
    return tuple(rgb) + (round(out_alpha * 255),)


def rounded_alpha(x, y, size, radius):
    px = min(x, size - 1 - x)
    py = min(y, size - 1 - y)
    if px >= radius or py >= radius:
        return 255
    cx = radius if x < radius else size - 1 - radius
    cy = radius if y < radius else size - 1 - radius
    return max(0, min(255, round((radius - math.hypot(x - cx, y - cy)) * 255)))


def circle(pixels, cx, cy, radius, color):
    h = len(pixels)
    w = len(pixels[0])
    for y in range(max(0, int(cy - radius - 1)), min(h, int(cy + radius + 2))):
        for x in range(max(0, int(cx - radius - 1)), min(w, int(cx + radius + 2))):
            d = math.hypot(x - cx, y - cy)
            if d <= radius + 0.5:
                a = max(0, min(255, round(color[3] * min(1, radius - d + 0.5))))
                pixels[y][x] = over(pixels[y][x], color[:3] + (a,))


def line(pixels, x1, y1, x2, y2, width, color):
    distance = max(1, math.hypot(x2 - x1, y2 - y1))
    steps = max(1, int(distance / max(1, width * 0.25)))
    for i in range(steps + 1):
        t = i / steps
        circle(pixels, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color)


def polyline(pixels, points, width, color):
    for start, end in zip(points, points[1:]):
        line(pixels, start[0], start[1], end[0], end[1], width, color)


def make_icon(size):
    pixels = [[(0, 0, 0, 0) for _ in range(size)] for _ in range(size)]
    s = size / 1024

    for y in range(size):
        for x in range(size):
            dx = x - size / 2
            dy = y - size * 0.72
            glow = max(0, 1 - math.hypot(dx, dy) / (size * 0.46))
            if glow:
                pixels[y][x] = (18, 154, 135, round(44 * glow * glow))

    rx = round(96 * s)
    rect_size = round(832 * s)
    radius = round(150 * s)
    for y in range(rx, rx + rect_size):
        for x in range(rx, rx + rect_size):
            a = rounded_alpha(x - rx, y - rx, rect_size, radius)
            if a:
                pixels[y][x] = over(pixels[y][x], TEAL[:3] + (a,))

    def p(x, y):
        return ((212 + x * 25) * s, (212 + y * 25) * s)

    stroke = max(7, 52 * s)
    heart = [
        p(19, 14), p(20.7, 12.3), p(22, 10.3), p(22, 8.5), p(22, 5.5),
        p(19.5, 3), p(16.5, 3), p(14.7, 3), p(13.4, 3.8), p(12, 5),
        p(10.6, 3.8), p(9.3, 3), p(7.5, 3), p(4.5, 3), p(2, 5.5),
        p(2, 8.5), p(2, 10.6), p(3.45, 12.55), p(5, 14), p(12, 21), p(19, 14),
    ]
    polyline(pixels, heart, stroke, WHITE)
    polyline(pixels, [p(12, 5), p(9.04, 7.96), p(8.85, 9.25), p(9.04, 10.45), p(10.4, 11.55), p(12.04, 11.1), p(14.11, 9.2), p(15.4, 8.65), p(17.9, 9.2), p(20.86, 11.86)], stroke, WHITE)
    polyline(pixels, [p(18, 15), p(16, 13)], stroke, WHITE)
    polyline(pixels, [p(15, 18), p(13, 16)], stroke, WHITE)
    return pixels


def downsample(pixels, factor):
    if factor == 1:
        return pixels
    h = len(pixels) // factor
    w = len(pixels[0]) // factor
    output = []
    for y in range(h):
        row = []
        for x in range(w):
            sums = [0, 0, 0, 0]
            for yy in range(factor):
                for xx in range(factor):
                    px = pixels[y * factor + yy][x * factor + xx]
                    for i in range(4):
                        sums[i] += px[i]
            row.append(tuple(round(v / (factor * factor)) for v in sums))
        output.append(row)
    return output


def png_bytes(pixels):
    h = len(pixels)
    w = len(pixels[0])
    raw = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in pixels)

    def chunk(name, data):
        return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def write_png(path, pixels):
    data = png_bytes(pixels)
    with open(path, "wb") as f:
        f.write(data)
    return data


def write_ico(path, png, size):
    header = struct.pack("<HHH", 0, 1, 1)
    directory = struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32, len(png), 22)
    with open(path, "wb") as f:
        f.write(header + directory + png)


def main():
    os.makedirs(ICON_DIR, exist_ok=True)
    for path, size in [
        (os.path.join(ICON_DIR, "icon-192.png"), 192),
        (os.path.join(ICON_DIR, "icon-512.png"), 512),
        (os.path.join(ICON_DIR, "apple-touch-icon.png"), 180),
        (os.path.join(PUBLIC_DIR, "favicon.png"), 64),
    ]:
        pixels = downsample(make_icon(size * 3), 3)
        data = write_png(path, pixels)
        if size == 64:
            write_ico(os.path.join(PUBLIC_DIR, "favicon.ico"), data, 64)


if __name__ == "__main__":
    main()

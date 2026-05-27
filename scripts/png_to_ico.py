import struct
import sys


def make_ico(png_paths, output_path):
    images = []
    for path in png_paths:
        with open(path, "rb") as file:
            data = file.read()
        size = png_size(data)
        images.append((size, data))

    offset = 6 + 16 * len(images)
    entries = []
    payload = b""

    for size, data in images:
        width = size if size < 256 else 0
        height = size if size < 256 else 0
        entries.append(struct.pack("<BBBBHHII", width, height, 0, 0, 1, 32, len(data), offset))
        payload += data
        offset += len(data)

    with open(output_path, "wb") as file:
        file.write(struct.pack("<HHH", 0, 1, len(images)))
        file.write(b"".join(entries))
        file.write(payload)


def png_size(data):
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    return struct.unpack(">I", data[16:20])[0]


if __name__ == "__main__":
    *inputs, output = sys.argv[1:]
    make_ico(inputs, output)

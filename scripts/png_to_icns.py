import struct
import sys


CHUNKS = [
    ("ic04", "icon_16x16.png"),
    ("ic05", "icon_32x32.png"),
    ("ic07", "icon_128x128.png"),
    ("ic08", "icon_256x256.png"),
    ("ic09", "icon_512x512.png"),
    ("ic10", "icon_512x512@2x.png"),
]


def make_icns(iconset_dir, output_path):
    chunks = []
    for code, filename in CHUNKS:
        with open(f"{iconset_dir}/{filename}", "rb") as file:
            data = file.read()
        chunks.append(code.encode("ascii") + struct.pack(">I", len(data) + 8) + data)

    body = b"".join(chunks)
    with open(output_path, "wb") as file:
        file.write(b"icns" + struct.pack(">I", len(body) + 8) + body)


if __name__ == "__main__":
    make_icns(sys.argv[1], sys.argv[2])

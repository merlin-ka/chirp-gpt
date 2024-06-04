from pathlib import Path
from base64 import b64encode

def dump_sounds(file):
    for wav in Path("sounds").glob("*.wav"):
        content = wav.read_bytes()
        b64 = b64encode(content).decode("ascii")
        file.write(f"    '{b64}',\n")

with open("script.js") as script:
    with open("chirp-gpt.user.js", "w") as output:
        for line in script:
            if "PLACE_SOUNDS_HERE" in line:
                dump_sounds(output)
            else:
                output.write(line)

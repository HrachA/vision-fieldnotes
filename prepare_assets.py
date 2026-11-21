"""Create the teaching subset and visual plates from the notebook's MNIST archive."""
import hashlib
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw

archive = Path(sys.argv[1])
assert hashlib.sha256(archive.read_bytes()).hexdigest() == "731c5ac602752760c8e48fbffcf8c3b850d9dc2a2aedcf2cc48468fc17b673d1"
assets = Path(__file__).parent / "docs" / "assets"
assets.mkdir(exist_ok=True)
with np.load(archive) as data:
    images, labels, test_images = data["x_train"], data["y_train"], data["x_test"]

train, queries = [], []
rng = np.random.default_rng(7)
for digit in range(10):
    picks = rng.choice(np.flatnonzero(labels == digit), 103, replace=False)
    train.extend(picks[:100])
    queries.extend(picks[100:])
assert not set(train).intersection(queries)
for name, indices in [("reference", train), ("queries", queries)]:
    records = np.column_stack((labels[indices], images[indices].reshape(-1, 784)))
    (assets / f"{name}.bin").write_bytes(records.astype("uint8").tobytes())


def project(x, y, height=0):
    return (390 + (x-14)*15.8 - (y-14)*4.9, 238 + (y-14)*12 + (x-14)*2.8 - height)


def interpolate(low, high, value):
    return tuple(int(a+(b-a)*value/255) for a,b in zip(low, high))


for index in range(3):
    plate = Image.new("RGB", (780, 465), (26, 29, 28))
    draw = ImageDraw.Draw(plate)
    for row in range(-21, 52):
        for col in range(-22, 48):
            x, y = project(col, row)
            draw.ellipse((x-1,y-1,x+1,y+1), fill=(63,67,62))
    for tick in range(0,29,7):
        draw.line([project(0,tick),project(28,tick)], fill=(67,73,65))
        draw.line([project(tick,0),project(tick,28)], fill=(67,73,65))
    for y, row in enumerate(test_images[index]):
        for x, value in enumerate(row.astype(int)):
            if value < 14:
                continue
            h = 5 + value/255*31
            a,b,c,d = [project(i,j,h) for i,j in [(x,y),(x+.98,y),(x+.98,y+.98),(x,y+.98)]]
            draw.polygon([a,b,c,d], fill=interpolate((60,72,50),(207,250,140),value), outline=(92,116,69))
            draw.polygon([d,c,project(x+.98,y+.98),project(x,y+.98)],fill=interpolate((42,52,37),(100,137,67),value))
            draw.polygon([b,c,project(x+.98,y+.98),project(x+.98,y)],fill=interpolate((48,65,41),(145,188,97),value))
    for x,y,dx,dy in [(0,0,1,1),(28,0,-1,1),(0,28,1,-1),(28,28,-1,-1)]:
        draw.line([project(x+dx*1.5,y),project(x,y),project(x,y+dy*1.5)],fill=(197,215,173),width=2)
    plate.save(assets/f"field-{index}.webp",quality=92)

sheet = Image.new("RGB",(520,270),(205,199,238))
draw = ImageDraw.Draw(sheet)
for j in range(3):
    for i in range(6):
        x,y = i*89-5, j*94-5
        draw.rectangle((x,y,x+87,y+92),outline=(166,160,201))
        digit = images[train[((i+j*6)%10)*100+j]]
        mask = Image.fromarray(digit).resize((65,65),Image.Resampling.NEAREST)
        sheet.paste((54,46,84),(x+12,y+10,x+77,y+75),mask)
sheet.save(assets/"contact-sheet.webp",quality=92)

export type CatMood = "idle" | "look" | "walk" | "happy" | "stretch" | "sleep";
export interface CatPose {
  mood: CatMood;
  time: number;
  facing: number;
  lookX: number;
  lookY: number;
  dark: boolean;
  reduced: boolean;
}

// Draw directly on a tiny pixel grid. The silhouette and each action are local,
// editable artwork; there are no borrowed sprites or animation dependencies.
function drawCat(ctx: CanvasRenderingContext2D, pose: CatPose) {
  const { mood, dark, reduced } = pose;
  const t = reduced ? 0 : pose.time;
  ctx.clearRect(0, 0, 48, 44);
  ctx.save();
  if (pose.facing < 0) {
    ctx.translate(48, 0);
    ctx.scale(-1, 1);
  }
  const step = Math.sin(t * 11);
  const bob =
    mood === "walk"
      ? Math.round(Math.abs(step))
      : mood === "happy"
        ? Math.round(Math.abs(Math.sin(t * 7)) * -3)
        : 0;
  ctx.translate(0, bob);
  const ink = "#18221e",
    edge = dark ? "#899d84" : "#3e5143",
    shadow = "#293b30",
    green = "#b8df99";
  const rect = (x: number, y: number, w: number, h: number, color = ink) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  if (mood === "walk" || mood === "stretch") {
    const stretch = mood === "stretch";
    const stride = reduced || stretch ? 0 : Math.round(Math.sin(t * 9) * 2);
    const leg = (x: number, sway: number, far: boolean) => {
      const bottom = far ? 38 : 40;
      const color = far ? "#50604d" : ink;
      rect(x, 30, 3, 5, color);
      rect(x + sway, 34, 3, bottom - 34, color);
      rect(x + sway - 1, bottom, 5, 2, color);
    };
    // Four distinct feet: the far pair lands a little higher than the near pair.
    leg(19, -stride, true);
    leg(stretch ? 32 : 38, stride, true);
    rect(10, 22, 22, 11, edge);
    rect(8, 25, 29, 7);
    rect(11, 23, 23, 9);
    rect(10, 30, 21, 3, shadow);
    rect(9, 22, 8, 2, shadow);
    leg(stretch ? 8 : 9, stride, false);
    leg(stretch ? 38 : 28, -stride, false);
    const tailTip = Math.round(Math.sin(t * 2.3) * 2);
    rect(4, 21, 6, 4);
    rect(2, 13 + tailTip, 3, 11 - tailTip);
    rect(3, 11 + tailTip, 5, 3);
    rect(5, 11 + tailTip, 3, 1, edge);
    ctx.save();
    if (stretch) ctx.translate(2, 6);
    rect(26, 6, 3, 12, edge);
    rect(28, 9, 3, 8);
    rect(40, 6, 3, 12, edge);
    rect(38, 9, 4, 9);
    rect(27, 10, 2, 6);
    rect(40, 10, 2, 6);
    rect(28, 12, 2, 4, shadow);
    rect(39, 12, 2, 4, shadow);
    rect(26, 16, 17, 12, edge);
    rect(24, 19, 21, 7);
    rect(26, 17, 17, 11);
    rect(29, 27, 12, 2);
    if (stretch || (!reduced && t % 6.3 > 6.1)) {
      rect(28, 22, 4, 1, green);
      rect(37, 22, 4, 1, green);
    } else {
      rect(28, 19, 4, 6, green);
      rect(37, 19, 4, 6, green);
      rect(30, 20, 1, 4);
      rect(39, 20, 1, 4);
      rect(28, 19, 1, 1, "#ecf5df");
      rect(37, 19, 1, 1, "#ecf5df");
    }
    rect(34, 25, 2, 1, "#819482");
    ctx.restore();
    ctx.restore();
    return;
  }
  // Curled tail, with a gently moving tip.
  const tail = Math.round(Math.sin(t * 1.9) * 2);
  rect(33, 29, 8, 4);
  rect(40, 23 + tail, 4, 10 - tail);
  rect(37, 20 + tail, 5, 4);
  rect(36, 20 + tail, 3, 1, edge);
  if (mood === "sleep") {
    rect(12, 28, 23, 10, edge);
    rect(10, 31, 28, 7);
    rect(13, 27, 19, 11);
    rect(9, 27, 15, 9);
    rect(10, 23, 4, 7);
    rect(20, 24, 4, 6);
    rect(12, 31, 4, 1, green);
    rect(19, 31, 3, 1, green);
    rect(15, 35, 2, 1, "#819482");
    rect(13, 38, 21, 1, shadow);
    if (!reduced) {
      const rise = Math.round((t % 3) * 2);
      rect(30, 12 - rise, 5, 1, dark ? "#b2c79c" : "#687060");
      rect(33, 13 - rise, 1, 1, green);
      rect(32, 14 - rise, 1, 1, green);
      rect(30, 15 - rise, 5, 1, green);
    }
    ctx.restore();
    return;
  }
  // Hind haunches and feet behind the front paws give the sitting pose depth.
  rect(10, 31, 8, 8, shadow);
  rect(29, 31, 8, 8, shadow);
  rect(9, 39, 7, 2, shadow);
  rect(32, 39, 7, 2, shadow);
  rect(15, 25, 17, 12, edge);
  rect(14, 26, 19, 12);
  rect(17, 27, 13, 9);
  rect(24, 28, 6, 7, shadow);
  rect(15, 34, 5, 5);
  rect(27, 34, 5, 5);
  rect(14, 39, 7, 2);
  rect(26, 39, 7, 2);
  // Large triangular ears and square-edged, rounded face.
  ctx.save();
  if (mood === "look")
    ctx.translate(Math.round(pose.lookX), Math.round(pose.lookY * 0.5));
  rect(10, 6, 3, 12, edge);
  rect(12, 8, 3, 10);
  rect(14, 11, 3, 8);
  rect(29, 6, 3, 12, edge);
  rect(27, 8, 4, 11);
  rect(25, 11, 4, 8);
  rect(11, 9, 2, 6);
  rect(29, 9, 2, 6);
  rect(12, 12, 2, 4, "#52634f");
  rect(28, 12, 2, 4, "#52634f");
  rect(11, 15, 21, 14, edge);
  rect(8, 18, 27, 9, edge);
  rect(10, 16, 23, 12);
  rect(8, 19, 27, 7);
  rect(12, 27, 19, 3);
  rect(11, 16, 19, 1, shadow);
  const blink = !reduced && t % 5.8 > 5.62;
  if (mood === "happy" || blink) {
    rect(12, 22, 5, 1, green);
    rect(12, 21, 1, 1, green);
    rect(16, 21, 1, 1, green);
    rect(25, 22, 5, 1, green);
    rect(25, 21, 1, 1, green);
    rect(29, 21, 1, 1, green);
  } else {
    rect(12, 19, 5, 6, green);
    rect(25, 19, 5, 6, green);
    const look = Math.round(
      Math.max(-1, Math.min(1, pose.lookX * pose.facing))
    );
    const y = Math.round(Math.max(-1, Math.min(1, pose.lookY)));
    rect(14 + look, 20 + y, 2, 4);
    rect(27 + look, 20 + y, 2, 4);
    rect(12, 19, 1, 1, "#ecf5df");
    rect(25, 19, 1, 1, "#ecf5df");
  }
  rect(21, 25, 2, 1, "#819482");
  rect(21, 27, 1, 1, shadow);
  if (mood === "happy") {
    rect(10, 25, 3, 1, "#a16c6c");
    rect(30, 25, 3, 1, "#a16c6c");
  }
  ctx.restore();
  if (mood === "happy" && !reduced) {
    const rise = Math.round((t % 1.4) * 4);
    rect(37, 9 - rise, 2, 2, "#a77762");
    rect(41, 9 - rise, 2, 2, "#a77762");
    rect(37, 11 - rise, 6, 2, "#a77762");
    rect(39, 13 - rise, 2, 2, "#a77762");
  }
  ctx.restore();
}

export function drawXiaohei(ctx: CanvasRenderingContext2D, pose: CatPose) {
  drawCat(ctx, pose);
  if (!pose.dark) return;
  // A one-pixel edge keeps a black cat legible on the night palette.
  const frame = ctx.getImageData(0, 0, 48, 44);
  const source = new Uint8ClampedArray(frame.data);
  for (let y = 1; y < 43; y++) {
    for (let x = 1; x < 47; x++) {
      const at = (y * 48 + x) * 4;
      if (source[at + 3]) continue;
      if ([-4, 4, -192, 192].some(offset => source[at + offset + 3] > 200)) {
        frame.data[at] = 115;
        frame.data[at + 1] = 138;
        frame.data[at + 2] = 111;
        frame.data[at + 3] = 170;
      }
    }
  }
  ctx.putImageData(frame, 0, 0);
}

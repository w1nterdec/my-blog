export type CatMood = "idle" | "look" | "walk" | "happy" | "stretch" | "sleep";
export interface CatPose {
  mood: CatMood;
  time: number;
  facing: number;
  lookX: number;
  lookY: number;
  dark: boolean;
  reduced: boolean;
  stride?: number;
  turn?: number;
}
// Symmetrical front reference: round white eyes, sage ears, a blue triangular
// mouth and a compact seated body. Each caller keeps its own motion clock.
export function drawXiaohei(ctx: CanvasRenderingContext2D, pose: CatPose) {
  const t = pose.reduced ? 0 : pose.time;
  const moving = pose.mood === "walk";
  const stride = pose.reduced ? 0 : (pose.stride ?? t * 7);
  const turn = pose.reduced
    ? 0
    : Math.max(0, Math.min(1, pose.turn ?? (moving ? 1 : 0)));
  const ink = "#0b1920",
    rim = pose.dark ? "#947365" : "#60362f",
    cream = "#fffefd";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(ctx.canvas.width / 100, ctx.canvas.height / 92);
  if (pose.facing < 0) {
    ctx.translate(100, 0);
    ctx.scale(-1, 1);
  }
  const ellipse = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    color = ink,
    angle = 0,
    stroke = false
  ) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = rim;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  };
  const shape = (d: string, color = ink, stroke = true) => {
    const path = new Path2D(d);
    ctx.fillStyle = color;
    ctx.fill(path);
    if (stroke) {
      ctx.strokeStyle = rim;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.stroke(path);
    }
  };
  const line = (d: string, color = rim, width = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(new Path2D(d));
  };
  ellipse(51, 89, 29, 1.7, pose.dark ? "#c7c2a015" : "#302d2314");
  const bob =
    pose.mood === "happy"
      ? -Math.abs(Math.sin(t * 5)) * 2
      : moving
        ? -Math.abs(Math.sin(stride)) * 0.5
        : Math.sin(t * 1.8) * 0.3;
  ctx.translate(0, bob);
  if (pose.mood === "sleep") {
    ellipse(52, 76, 29, 11, ink, 0, true);
    ellipse(33, 69, 21, 16, ink, 0, true);
    shape("M15 65 16 49 29 59M45 59 59 66 49 77");
    line("M20 70q5 4 10 0M35 70q5 4 10 0", cream, 2);
    ellipse(38, 85, 8, 2);
    ctx.restore();
    return;
  }
  // Tail and rear paws stay behind the body; front paws have their own outline.
  shape(`M37 85C19 86 10 77 14 ${70 + Math.sin(t * 1.8)}c4-7 9-6 12 3l11 10Z`);
  if (moving) {
    // During contact the paw moves back against travel; only the returning
    // paw lifts. Rounded limbs stay tucked beneath the familiar upright body.
    const leg = (x: number, phase: number, back: boolean) => {
      const cycle = ((stride + phase) % (Math.PI * 2)) / (Math.PI * 2);
      const contact = cycle < 0.62;
      const progress = contact ? cycle / 0.62 : (cycle - 0.62) / 0.38;
      const step = contact ? 3 - progress * 6 : -3 + progress * 6;
      const lift = contact ? 0 : Math.sin(progress * Math.PI) * 3;
      const foot = x + step;
      const floor = (back ? 86 : 89) - lift;
      const outline = `M${x - 4} 77Q${foot - 4} 81 ${foot - 4} ${floor - 2}Q${foot - 4} ${floor} ${foot} ${floor}Q${foot + 4} ${floor} ${foot + 4} ${floor - 2}Q${foot + 4} 81 ${x + 4} 77`;
      shape(`${outline}L${x + 4} 71H${x - 4}Z`, back ? "#16242a" : ink, false);
      line(outline, rim, 1.8);
    };
    leg(36, Math.PI / 2, true);
    leg(64, Math.PI * 1.5, true);
    leg(42, 0, false);
    leg(58, Math.PI, false);
    // Cover the roots with the torso; never outline a seam across the legs.
    shape("M38 60Q33 68 34 77q16 4 32 0 1-9-4-17Z", ink, false);
    line("M38 60Q33 68 34 77M62 60q5 8 4 17", rim, 1.8);
  } else {
    shape("M37 61Q30 74 33 86q2 3 7 2M63 61q7 13 4 25-2 3-7 2");
    shape("M38 60Q34 68 35 81l2 7q5 3 12 1l1-13 1 13q7 2 12-1l2-7q1-13-3-21Z");
    line("M49 74q2 7 1 14M51 74q-2 7-1 14", rim, 1.6);
    line("M36 79q0 7 3 9M64 79q0 7-3 9", rim, 1.6);
  }
  ctx.save();
  // A small three-quarter turn foreshortens the far eye and moves the muzzle
  // toward travel. At rest all these offsets return to the mirrored front view.
  ctx.translate(50 + turn * 3, 38);
  ctx.scale(1 - turn * 0.1, 1);
  ctx.translate(-50, -38);
  // Draw each paired feature from one source, reflected around x=50.
  // Keep pupils fixed: pointer tracking must not break the reference symmetry.
  const mirrored = (draw: () => void) => {
    draw();
    ctx.save();
    ctx.translate(100, 0);
    ctx.scale(-1, 1);
    draw();
    ctx.restore();
  };
  mirrored(() => {
    shape("M10 42Q3 29 5 12 6 7 28 10L35 24Z");
    shape("M7 16q7 0 16 12L13 43Q5 29 7 16Z", "#c3cf96");
  });
  ellipse(50, 38, 40, 29, ink, 0, true);
  const blink = !pose.reduced && t % 6.4 > 6.26;
  if (blink || pose.mood === "happy" || pose.mood === "stretch") {
    mirrored(() => line("M19 35q12-10 24 0", cream, 2.6));
  } else {
    ellipse(31 + turn * 6, 36, 17 - turn * 3, 21, cream, 0, true);
    ellipse(31 + turn * 8, 32, 12.4 - turn * 2.8, 15.2, ink, 0, true);
    ellipse(69 + turn * 6, 36, 17, 21, cream, 0, true);
    ellipse(69 + turn * 8, 32, 12.4, 15.2, ink, 0, true);
  }
  ctx.translate(turn * 8, 0);
  shape("M50 53q-1-1-2 1l-3 7q5 2 10 0l-3-7q-1-2-2-1Z", "#77c2ce");
  ctx.restore();
  if (pose.mood === "happy" && !pose.reduced) {
    ctx.save();
    ctx.translate(85, 12 - (t % 1.8) * 3);
    ctx.scale(0.6, 0.6);
    shape("M0 3C-5-2-8 5 0 10C8 5 5-2 0 3", "#b28b7d", false);
    ctx.restore();
  }
  ctx.restore();
}

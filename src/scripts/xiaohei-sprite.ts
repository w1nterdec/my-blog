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
// Original vector drawing rendered at 3x resolution. The controller retains
// separate motion clocks for the rail cat and the garden/reading companion.
export function drawXiaohei(ctx: CanvasRenderingContext2D, pose: CatPose) {
  const { mood, reduced, dark } = pose;
  const t = reduced ? 0 : pose.time;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(ctx.canvas.width / 48, ctx.canvas.height / 44);
  if (pose.facing < 0) {
    ctx.translate(48, 0);
    ctx.scale(-1, 1);
  }
  const ink = "#202b25",
    far = "#49574b",
    rim = dark ? "#879a7c" : "#35453a",
    green = "#b7de8c";
  const ellipse = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    color = ink,
    outline = false
  ) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = rim;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }
  };
  const shape = (path: string, color = ink, outline = false) => {
    const p = new Path2D(path);
    ctx.fillStyle = color;
    ctx.fill(p);
    if (outline) {
      ctx.strokeStyle = rim;
      ctx.lineWidth = 0.7;
      ctx.lineJoin = "round";
      ctx.stroke(p);
    }
  };
  const line = (path: string, color = ink, width = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke(new Path2D(path));
  };
  const walk = mood === "walk" || mood === "stretch";
  const bob =
    mood === "happy"
      ? -Math.abs(Math.sin(t * 5.5)) * 1.7
      : walk
        ? -Math.abs(Math.sin(t * 8)) * 0.65
        : Math.sin(t * 1.8) * 0.25;
  ctx.translate(0, bob);
  ellipse(24, 41, 15, 1.1, dark ? "#b7c5a012" : "#22372812");
  const sway = Math.sin(t * 1.9) * 2;
  // The tail is drawn behind the torso and ears, never attached to a leg.
  line(
    walk
      ? `M12 29C3 27 3 ${14 + sway} 9 ${15 + sway}`
      : `M30 34C44 40 44 ${24 + sway} 37 ${24 + sway}`,
    rim,
    3.8
  );
  line(
    walk
      ? `M12 29C3 27 3 ${14 + sway} 9 ${15 + sway}`
      : `M30 34C44 40 44 ${24 + sway} 37 ${24 + sway}`,
    ink,
    2.9
  );
  if (mood === "sleep") {
    ellipse(24, 34, 15, 6.8, ink, true);
    ellipse(16, 30, 9.5, 7.4, ink, true);
    shape("M8 26L9 18L16 24M18 24L24 20L23 29", ink, true);
    line("M10 31Q12 33 14 31M18 31Q20 33 22 31", green, 1.1);
    ellipse(16, 34, 0.8, 0.55, "#82967d");
    ellipse(14, 38, 4, 1.5);
    if (!reduced) {
      ctx.globalAlpha = 0.6;
      ctx.font = "5px Georgia";
      ctx.fillStyle = green;
      ctx.fillText("z", 33, 18 - (t % 3) * 2);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    return;
  }
  const foot = (x: number, phase: number, back: boolean) => {
    const stride = mood === "walk" ? Math.sin(t * 8 + phase) * 2.4 : 0;
    const lift =
      mood === "walk" ? Math.max(0, Math.cos(t * 8 + phase)) * 1.4 : 0;
    const ground = back ? 38.2 : 40;
    line(
      `M${x} 30Q${x + stride * 0.3} 35 ${x + stride} ${ground - lift}`,
      back ? far : ink,
      back ? 2.8 : 3.2
    );
    ellipse(x + stride + 0.8, ground - lift, 2.4, 1, back ? far : ink);
  };
  if (walk) {
    foot(15, Math.PI, true);
    foot(34, 0, true);
    ellipse(23, 27.5, 13.8, 6.4, ink, true);
    ellipse(22, 30, 10, 2.8, "#2b3c30");
    foot(10, 0, false);
    foot(29, Math.PI, false);
  } else {
    // Two visible rear haunches, two separate front paws.
    ellipse(15, 34.5, 5.6, 5.2, far);
    ellipse(31, 34.5, 5.6, 5.2, far);
    ellipse(12, 39, 3.5, 1.4, far);
    ellipse(34, 39, 3.5, 1.4, far);
    ellipse(23, 30, 8.5, 9.3, ink, true);
    line("M19 31L18 39M27 31L28 39", ink, 3.6);
    ellipse(18, 40, 3.1, 1.1);
    ellipse(28, 40, 3.1, 1.1);
  }
  ctx.save();
  if (walk) ctx.translate(9, mood === "stretch" ? 7 : 1);
  if (mood === "look") ctx.translate(pose.lookX * 0.5, pose.lookY * 0.3);
  // Long triangular ears and a soft cheek silhouette are readable at 60px.
  shape("M9 17Q8 11 10 4L19 14M28 14L35 4Q37 12 35 18", ink, true);
  shape("M11 8L15.5 14L11.5 15M33.5 8L29.5 14L34 15", "#4b5d49");
  ellipse(22.5, 21, 13.8, 10.4, ink, true);
  shape("M9 21L6.5 23L10 25M35 21L38 23L34.8 26");
  const blink = !reduced && (t % 6.1 > 5.94 || t % 9.7 > 9.57);
  if (mood === "happy" || mood === "stretch" || blink) {
    line("M13 22Q15.5 19 18 22M27 22Q29.5 19 32 22", green, 1.3);
  } else {
    ellipse(15.6, 21.5, 3.4, 4.2, green);
    ellipse(29.5, 21.5, 3.4, 4.2, green);
    const look = Math.max(-1, Math.min(1, pose.lookX * pose.facing));
    ellipse(15.6 + look, 21.7 + pose.lookY * 0.4, 0.95, 3.1);
    ellipse(29.5 + look, 21.7 + pose.lookY * 0.4, 0.95, 3.1);
    ellipse(14.7, 19.8, 0.75, 0.75, "#f5f8df");
    ellipse(28.6, 19.8, 0.75, 0.75, "#f5f8df");
  }
  shape("M21.4 26L23.5 26L22.5 27.2", "#82967d");
  line("M22.5 27.2L22.5 28M20.7 28Q22.5 29 24.3 28", "#536850", 0.55);
  if (mood === "happy") {
    ellipse(11.5, 25.5, 1.8, 0.55, "#9a706a");
    ellipse(33.5, 25.5, 1.8, 0.55, "#9a706a");
  }
  ctx.restore();
  if (mood === "happy" && !reduced) {
    ctx.save();
    ctx.translate(38, 11 - (t % 1.7) * 3);
    ctx.scale(0.6, 0.6);
    shape("M0 3C-5-2-8 5 0 10C8 5 5-2 0 3", "#ac8678");
    ctx.restore();
  }
  ctx.restore();
}

export function randomPointInCircle(radius: number): { x: number; y: number } {
  // Uniform distribution over area:
  // r = sqrt(u) * R, theta = 2pi*v
  const u = Math.random();
  const v = Math.random();
  const r = Math.sqrt(u) * radius;
  const theta = 2 * Math.PI * v;
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}


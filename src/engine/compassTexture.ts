import * as THREE from 'three';
import {
  CompassDirection,
  UserFengShuiProfile,
} from '../types/fengshui';

export interface CompassTextureOptions {
  userProfile: UserFengShuiProfile;
  roomDirection: CompassDirection;
  opacity?: number;
}

/**
 * Helper to draw a rounded rectangle on Canvas 2D
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Creates photorealistic architectural Bát Quái Compass overlay canvas matching reference photo.
 */
export function createFengShuiCompassCanvas(options: CompassTextureOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = 2048;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  // Scaled outer radius to provide ample canvas padding on all 4 borders (preventing any badge clipping)
  const outerR = size * 0.35; // ~716px
  const innerTrackR = size * 0.315; // ~645px

  ctx.clearRect(0, 0, size, size);

  // 1. Soft Circular Floor Radial Vignette behind/around the room
  const radialBg = ctx.createRadialGradient(cx, cy, outerR * 0.35, cx, cy, outerR * 1.15);
  radialBg.addColorStop(0, 'rgba(16, 19, 22, 0.4)');
  radialBg.addColorStop(0.72, 'rgba(14, 17, 20, 0.72)');
  radialBg.addColorStop(0.92, 'rgba(12, 14, 16, 0.88)');
  radialBg.addColorStop(1, 'rgba(10, 12, 14, 0)');
  ctx.fillStyle = radialBg;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 1.15, 0, Math.PI * 2);
  ctx.fill();

  // 2. 8 Feng Shui Sectors: dynamically bound to user's Bát Quái profile
  const rawSectors: Array<{ dir: CompassDirection; label: string; angle: number }> = [
    { dir: 'N', label: 'Bắc', angle: 0 },
    { dir: 'NE', label: 'Đông Bắc', angle: 45 },
    { dir: 'E', label: 'Đông', angle: 90 },
    { dir: 'SE', label: 'Đông Nam', angle: 135 },
    { dir: 'S', label: 'Nam', angle: 180 },
    { dir: 'SW', label: 'Tây Nam', angle: 225 },
    { dir: 'W', label: 'Tây', angle: 270 },
    { dir: 'NW', label: 'Tây Bắc', angle: 315 },
  ];

  const sectorData = rawSectors.map((s) => {
    const detail = options.userProfile?.directionDetails?.[s.dir];
    return {
      dir: s.dir,
      label: s.label,
      angle: s.angle,
      subLabel: detail ? detail.name : (s.dir === 'N' ? 'Họa Hại' : 'Sinh Khí'),
      isGood: detail ? detail.isGood : false,
    };
  });

  // Draw 8 sector wedge fans
  sectorData.forEach((sec) => {
    // 45 degree slice centered on sec.angle
    const startAngle = ((sec.angle - 22.5 - 90) * Math.PI) / 180;
    const endAngle = ((sec.angle + 22.5 - 90) * Math.PI) / 180;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR * 0.96, startAngle, endAngle);
    ctx.closePath();

    const grad = ctx.createRadialGradient(cx, cy, innerTrackR * 0.45, cx, cy, outerR * 0.96);
    if (sec.isGood) {
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
      grad.addColorStop(0.85, 'rgba(16, 185, 129, 0.16)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Outer rim arc in subtle emerald
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * 0.96, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      grad.addColorStop(0, 'rgba(225, 29, 72, 0.24)');
      grad.addColorStop(0.85, 'rgba(225, 29, 72, 0.18)');
      grad.addColorStop(1, 'rgba(225, 29, 72, 0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Outer rim arc in subtle crimson
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * 0.96, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  });

  // 3. Circular Hairline Compass Rings
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, innerTrackR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 3b. Center Yin-Yang (Thái Cực) and Concentric Rings (Matching reference render)
  const yinyangR = 52;
  const innerRings = [yinyangR * 2.2, yinyangR * 3.8, innerTrackR * 0.65, innerTrackR * 0.85];
  innerRings.forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  });

  // Draw Yin-Yang Circle
  ctx.save();
  ctx.translate(cx, cy);
  // Soft outer glow behind Yin-Yang
  ctx.beginPath();
  ctx.arc(0, 0, yinyangR + 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.fill();

  // White base circle
  ctx.beginPath();
  ctx.arc(0, 0, yinyangR, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Black S-curve half
  ctx.beginPath();
  ctx.arc(0, 0, yinyangR, -Math.PI / 2, Math.PI / 2, false);
  ctx.arc(0, yinyangR / 2, yinyangR / 2, Math.PI / 2, -Math.PI / 2, true);
  ctx.arc(0, -yinyangR / 2, yinyangR / 2, Math.PI / 2, -Math.PI / 2, false);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // White dot in black half
  ctx.beginPath();
  ctx.arc(0, yinyangR / 2, yinyangR / 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Black dot in white half
  ctx.beginPath();
  ctx.arc(0, -yinyangR / 2, yinyangR / 6, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.restore();

  // 4. 360 Degree Graduation Ticks
  for (let deg = 0; deg < 360; deg += 2) {
    const rad = ((deg - 90) * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMedium = deg % 10 === 0;

    const tickLen = isMajor ? 30 : isMedium ? 18 : 8;
    const r1 = outerR;
    const r2 = outerR - tickLen;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
    ctx.lineTo(cx + Math.cos(rad) * r2, cy + Math.sin(rad) * r2);

    ctx.strokeStyle = isMajor
      ? 'rgba(255, 255, 255, 0.85)'
      : isMedium
      ? 'rgba(255, 255, 255, 0.42)'
      : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = isMajor ? 2.5 : isMedium ? 1.6 : 1.0;
    ctx.stroke();
  }

  // 5. Degree Labels (30°, 90°, 180°, 270°, 330°) - Clean separation from badges
  const degreeNumbers = [
    { deg: 30, text: '30°' },
    { deg: 90, text: '90°' },
    { deg: 180, text: '180°' },
    { deg: 270, text: '270°' },
    { deg: 330, text: '330°' },
  ];

  degreeNumbers.forEach(({ deg, text }) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    const dist = outerR + 24;
    const tx = cx + Math.cos(rad) * dist;
    const ty = cy + Math.sin(rad) * dist;

    ctx.save();
    ctx.font = 'bold 26px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, tx, ty);
    ctx.restore();
  });

  // 6. Floating Sector Badges - Extra Large, High Contrast & Crystal Clear
  sectorData.forEach((sec) => {
    const rad = ((sec.angle - 90) * Math.PI) / 180;
    const badgeDist = outerR + 102;
    const bx = cx + Math.cos(rad) * badgeDist;
    const by = cy + Math.sin(rad) * badgeDist;

    ctx.save();
    ctx.translate(bx, by);

    // Subtle drop shadow for badges
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    if (sec.dir === 'N') {
      // Top North Marker: Large Circular Red/White "B" Badge + "Bắc" Red Pill
      // Circle B
      ctx.beginPath();
      ctx.arc(0, -42, 34, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#DC2626';
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.font = 'bold 38px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#DC2626';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', 0, -40);

      // Red Pill "Bắc"
      const pillW = 126;
      const pillH = 46;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#DC2626';
      roundRect(ctx, -pillW / 2, 4, pillW, pillH, 23);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.font = 'bold 26px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Bắc', 0, 27);
    } else {
      // Standard Two-tier Pill: Dark Direction Label + Saturated Colored Star Pill
      const darkPillW = 142;
      const darkPillH = 44;
      const colPillW = 132;
      const colPillH = 42;

      // Dark top direction pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, -darkPillW / 2, -48, darkPillW, darkPillH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sec.label, 0, -26);

      // Colored bottom star pill
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = sec.isGood ? '#059669' : '#DC2626';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.2;
      roundRect(ctx, -colPillW / 2, 4, colPillW, colPillH, 21);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.font = 'bold 22px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(sec.subLabel, 0, 25);
    }

    ctx.restore();
  });

  return canvas;
}

/**
 * Creates or updates a Three.js CanvasTexture for the Bát Quái Compass overlay.
 */
export function getFengShuiCompassTexture(options: CompassTextureOptions): THREE.CanvasTexture {
  const canvas = createFengShuiCompassCanvas(options);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

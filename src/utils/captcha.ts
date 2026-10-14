/**
 * High-security offline CAPTCHA generator.
 * Produces crisp, distorted visual challenges fitted strictly inside any container.
 * No internet connection or external API needed.
 */

export interface CaptchaData {
  text: string;
  dataUrl: string;
}

const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateCaptchaText(length = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export function renderOfflineCaptcha(text: string, width = 180, height = 50): string {
  if (typeof document === 'undefined') return '';
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Background random lines (noise)
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 40%, 75%)`;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.bezierCurveTo(
      Math.random() * width, Math.random() * height,
      Math.random() * width, Math.random() * height,
      Math.random() * width, Math.random() * height
    );
    ctx.stroke();
  }

  // Draw characters with individual rotation and displacement
  const charSpacing = width / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    ctx.save();
    
    // Position
    const x = charSpacing * (i + 0.85);
    const y = height / 2 + (Math.random() * 8 - 4);
    ctx.translate(x, y);

    // Random rotation (-25 to +25 deg)
    const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
    ctx.rotate(angle);

    // Character font & color
    ctx.font = `bold ${24 + Math.floor(Math.random() * 6)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = `hsl(${210 + Math.random() * 50}, 80%, ${25 + Math.random() * 20}%)`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  // Foreground noise dots
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, 0.5)`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}

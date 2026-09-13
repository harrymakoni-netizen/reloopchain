import logo from "@/assets/reloop-logo.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * The supplied artwork is a wide PNG with very large white margins.
 * We never stretch it: the container clips, and the image is scaled by width
 * and offset so the intended region fills the frame exactly.
 * Source artwork: 1456 x 1088. Mark occupies ~x100-500, y310-730.
 * Full lockup occupies ~x100-1350, y310-730.
 */

export function LogoMark({
  size = 34,
  className,
}: {
  size?: number | undefined;
  className?: string | undefined;
}) {
  const scale = size / 400; // crop width 400px of source
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-sm bg-white",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src={logo.url}
        alt=""
        style={{
          position: "absolute",
          width: 1456 * scale,
          height: 1088 * scale,
          left: -105 * scale,
          top: -320 * scale,
          maxWidth: "none",
        }}
      />
    </span>
  );
}

export function LogoLockup({
  width = 190,
  className,
  label = "ReLoop by HJM Technologies",
}: {
  width?: number | undefined;
  className?: string | undefined;
  label?: string | undefined;
}) {
  const cropW = 1250;
  const cropH = 420;
  const scale = width / cropW;
  return (
    <span
      className={cn("relative block overflow-hidden bg-white", className)}
      style={{ width, height: cropH * scale }}
      role="img"
      aria-label={label}
    >
      <img
        src={logo.url}
        alt=""
        style={{
          position: "absolute",
          width: 1456 * scale,
          height: 1088 * scale,
          left: -100 * scale,
          top: -315 * scale,
          maxWidth: "none",
        }}
      />
    </span>
  );
}

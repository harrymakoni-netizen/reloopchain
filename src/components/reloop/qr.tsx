import { useEffect, useState } from "react";

export function QrCode({
  value,
  size = 148,
  label,
}: {
  value: string;
  size?: number | undefined;
  label?: string | undefined;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setSrc(null);
    setFailed(false);
    import("qrcode")
      .then((mod) =>
        mod.default.toDataURL(value, {
          margin: 1,
          width: size * 2,
          errorCorrectionLevel: "M",
          color: { dark: "#142D32", light: "#ffffff" },
        }),
      )
      .then((url) => {
        if (live) setSrc(url);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        className="flex items-center justify-center border border-border p-3 text-center text-[0.6875rem] text-muted-foreground"
        style={{ width: size, height: size }}
      >
        QR could not be rendered. Use the passport link below.
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center border border-border bg-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          width={size - 8}
          height={size - 8}
          alt={label ?? `QR code linking to ${value}`}
        />
      ) : (
        <span className="text-[0.6875rem] text-muted-foreground">Generating…</span>
      )}
    </div>
  );
}

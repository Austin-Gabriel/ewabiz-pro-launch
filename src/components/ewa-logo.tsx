import ewaMark from "@/assets/ewa-mark.png";
import ewaWordmarkDark from "@/assets/ewa-wordmark.png";
import ewaWordmarkLight from "@/assets/ewa-wordmark-light.png";

/**
 * Brand mark (orange bagel disc). Always #FF823F. Use when space is tight or
 * when the wordmark would compete (e.g., splash, header chrome, biometric).
 */
export function EwaMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={ewaMark}
      alt="Ewà"
      draggable={false}
      className={className}
      style={{ height: size, width: size, display: "block" }}
    />
  );
}

/**
 * Wordmark only ("ewà" in editorial serif with the orange grave accent).
 * Picks dark or light variant based on background. Reserve for hero brand
 * moments; do not use as a UI label.
 */
export function EwaWordmark({
  size = 28,
  isDark = true,
  className,
}: {
  size?: number;
  isDark?: boolean;
  className?: string;
}) {
  return (
    <img
      src={isDark ? ewaWordmarkDark : ewaWordmarkLight}
      alt="ewà"
      draggable={false}
      className={className}
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}

/**
 * Horizontal lockup: bagel + wordmark + tiny "BIZ" tag. The default brand
 * presentation across welcome, splash, sign-in, and verify.
 */
export function EwaLockup({
  isDark = true,
  markSize = 44,
  className,
}: {
  isDark?: boolean;
  markSize?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: "inline-flex", alignItems: "center", gap: markSize * 0.36 }}>
      <EwaMark size={markSize} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <EwaWordmark size={markSize * 0.78} isDark={isDark} />
        <span
          style={{
            fontFamily: '"Uncut Sans", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: 8.5,
            letterSpacing: "4px",
            color: "#FF823F",
            lineHeight: 1,
            paddingLeft: 2,
          }}
        >
          BIZ
        </span>
      </div>
    </div>
  );
}
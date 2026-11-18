import { ShaderOrb, type OrbState } from "@/components/ui/orbkit-core";
import { shdr21Orb } from "@/components/ui/shdr-21";

/**
 * Sibilla's palette for the shader, per state (light = the lit side of the cloud, shadow = its depths).
 * The same colors as the brand: amber, honey and ink. Thinking stays amber (a pale or cool light vanishes on the light
 * theme at chat size) and reads as a brighter glow over a lighter honey.
 */
const SIBILLA_COLORS: Record<OrbState, { light: string; shadow: string }> = {
  idle: { light: "#fecb00", shadow: "#7d3500" }, // amber over deep honey
  thinking: { light: "#ffd84d", shadow: "#c25e00" }, // bright amber over honey
  speaking: { light: "#e77500", shadow: "#2b1401" }, // honey over ink
};

/**
 * Sibilla's sphere: the oracle's presence on the start screen and, small, the sign that she is at work. Decorative.
 * Rendered by the SHDR-21 volumetric shader from orbkit (light diffusing through a cloud). The size comes from
 * `className`: ShaderOrb is used directly because the `Shdr21` wrapper defaults to an inline 280px that beats the class.
 */
export function Orb({ className = "", state = "idle" }: { className?: string; state?: OrbState }) {
  return <ShaderOrb variant={shdr21Orb} state={state} stateColors={SIBILLA_COLORS} className={`inline-block shrink-0 ${className}`} />;
}

export function procgenColor(name: string): string {
    let v = 31;
    for (let i = 0; i < name.length; i++) v = name.charCodeAt(i) * 7 + ((v << 4) - v);

    const hue = (v & 0xFFFF) * 360 / 0xFFFF;
    return `oklch(0.9 0.1 ${hue})`;
}

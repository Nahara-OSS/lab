export function procgenColor(name: string): string {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        let base = name.charCodeAt(i);

        for (let j = 0; j < 10; j++) {
            base = (base << 5) - base;
        }

        hash = base ^ (hash << 7);
    }

    return `oklch(0.9 0.1 ${((hash & 0xFFFF) * 360 / 0xFFFF)})`;
}

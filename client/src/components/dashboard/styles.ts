export const dashCard = "rounded-xl border border-border bg-card";

export const dashInput =
	"block h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-[14.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

const btnBase =
	"inline-flex items-center justify-center gap-2 rounded-lg border font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

export const btnPrimary = `${btnBase} h-11 border-primary bg-primary px-4 text-[14.5px] text-primary-foreground hover:bg-primary-hover`;
export const btnGhost = `${btnBase} h-11 border-border bg-card px-4 text-[14.5px] text-foreground hover:bg-surface-2`;
export const btnDanger = `${btnBase} h-11 border-destructive bg-destructive px-4 text-[14.5px] text-destructive-foreground hover:opacity-90`;
export const btnDangerGhost = `${btnBase} h-11 border-destructive bg-card px-4 text-[14.5px] text-destructive hover:bg-destructive-soft`;
export const btnText = `${btnBase} h-8 border-transparent px-0 text-sm text-primary-text hover:underline`;

export const btnSm = "h-9 px-3 text-[13.5px]";

export const iconBtn =
	"inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card text-foreground transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4.25";

export const th = "px-4 py-3 text-left text-[13px] font-medium whitespace-nowrap text-muted-foreground";
export const td = "px-4 py-3 align-middle";

export const label = "mb-1.5 block text-sm font-semibold";
export const help = "mt-1.5 text-[13px] text-muted-foreground";

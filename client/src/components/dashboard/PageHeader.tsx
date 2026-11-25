import type { ReactNode } from "react";

export default function PageHeader({
	title,
	description,
	actions,
}: {
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-3.5">
			<div className="flex min-w-0 flex-col gap-1">
				<h1 className="text-[26px] leading-tight font-bold tracking-[-0.01em] sm:text-[30px]">{title}</h1>
				{description && <p className="text-[14.5px] text-muted-foreground">{description}</p>}
			</div>
			{actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
		</div>
	);
}

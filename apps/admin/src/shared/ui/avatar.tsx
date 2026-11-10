import { avatarColor } from "@/shared/lib/project-color";
import { cn } from "@/shared/lib/utils";

export function Avatar({
  userId,
  name,
  className,
}: {
  userId: number;
  name: string;
  className?: string;
}) {
  const c = avatarColor(userId);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
        className,
      )}
      style={{ background: c.bg, color: c.fg }}
    >
      {name.slice(0, 1)}
    </div>
  );
}

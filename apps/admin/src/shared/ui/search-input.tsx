import { Search } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-10 min-w-56 items-center gap-2 rounded-md border border-[#e2e0da] bg-white px-3 transition-[border-color,box-shadow] focus-within:border-cobalt focus-within:ring-4 focus-within:ring-cobalt/12",
        className,
      )}
    >
      <Search aria-hidden="true" className="size-[15px] shrink-0 text-[#8c9097]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-faint"
      />
    </label>
  );
}

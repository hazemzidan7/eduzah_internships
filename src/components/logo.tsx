import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <div
      className={cn("inline-flex items-center rounded-xl bg-white px-2 py-1 shadow-sm", className)}
      style={{ height: height + 8 }}
    >
      <Image
        src="/logo.png"
        alt="EDUZAH"
        width={height * 3.4}
        height={height}
        priority
        className="h-full w-auto object-contain"
      />
    </div>
  );
}

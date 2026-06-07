"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { cn } from "@/lib/utils";

export function LottieAnimation({
  src,
  className,
  loop = true,
  autoplay = true,
  ariaLabel = "",
}) {
  return (
    <div
      className={cn(
        "overflow-hidden motion-reduce:hidden [&_canvas]:h-full! [&_canvas]:w-full!",
        className,
      )}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel || undefined}
      aria-hidden={ariaLabel ? undefined : true}>
      <DotLottieReact src={src} loop={loop} autoplay={autoplay} />
    </div>
  );
}

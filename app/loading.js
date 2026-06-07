import { LottieAnimation } from "@/components/lottie-animation";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="grid justify-items-center gap-3">
        <LottieAnimation
          src="/Football4.lottie"
          className="size-40"
          ariaLabel="Loading football screen"
        />
        <p className="text-sm font-semibold text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}

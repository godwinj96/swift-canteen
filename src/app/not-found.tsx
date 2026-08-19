import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 sm:px-8 py-24 text-center">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        404
      </span>
      <h1 className="font-display mt-3 text-4xl tracking-tight text-ink">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className="mt-8">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}

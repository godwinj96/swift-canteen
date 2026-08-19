import Link from "next/link";

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t border-stone-200 bg-white py-6 text-center text-sm text-stone-500 sm:flex-row sm:justify-between sm:px-8">
      <span>© {new Date().getFullYear()} Swift Canteen. Order ahead, skip the line.</span>
      <nav className="flex items-center gap-4">
        <Link href="/terms" className="hover:text-canteen">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-canteen">
          Privacy
        </Link>
      </nav>
    </footer>
  );
}

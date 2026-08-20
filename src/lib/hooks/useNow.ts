"use client";

import { useEffect, useState } from "react";

/**
 * A live clock value, safe for SSR. Starts null (not Date.now()) so the
 * server render and the client's pre-hydration render agree — reading
 * Date.now() as the initial state produces a different value on the server
 * than at client hydration time, which is a real hydration-mismatch source
 * for any "time ago" display. Only picks up the real clock after mount, and
 * only inside the rAF callback (not synchronously in the effect body) so it
 * settles once rather than cascading renders.
 */
export function useNow(intervalMs: number): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const rafId = requestAnimationFrame(() => {
      setNow(Date.now());
      intervalId = setInterval(() => setNow(Date.now()), intervalMs);
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalMs]);

  return now;
}

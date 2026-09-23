"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Runs one submission at a time. Extra calls while one is pending are ignored,
 * so a double click never sends two requests (CA27, N20).
 */
export function useSubmitLock() {
  const pendingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const run = useCallback(async (task: () => Promise<void>) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setSubmitting(true);
    try {
      await task();
    } finally {
      pendingRef.current = false;
      setSubmitting(false);
    }
  }, []);

  return { submitting, run };
}

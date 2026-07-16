import { useCallback, useEffect, useState } from 'react';

const TOAST_DURATION_MS = 5000;

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ type, message }) => {
    setToast({ type, message, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast || toast.type === 'pending') return undefined;

    const timeoutId = window.setTimeout(dismissToast, TOAST_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [dismissToast, toast]);

  return { toast, showToast, dismissToast };
}

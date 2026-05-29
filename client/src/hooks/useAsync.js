import { useState, useEffect, useRef } from 'react';

/**
 * Data-fetching hook with automatic cleanup on unmount.
 *
 * @param {() => Promise<any>} asyncFn - Function that returns a Promise. Called on mount and when deps change.
 * @param {any[]}                [deps] - Dependency array. asyncFn is re-executed when these change.
 *
 * @returns {{ data: any, loading: boolean, error: any }}
 *
 * Usage:
 *   const { data, loading, error } = useAsync(() => faqs.getAll(params), [page, sort]);
 *
 * The isMounted guard prevents setState calls after the component unmounts,
 * avoiding "Can't update unmounted component" React warnings.
 */
function useAsync(asyncFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Use a ref for the abort flag so the cleanup function always sees the
  // current value without needing the effect to re-run.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    setLoading(true);
    setError(null);

    asyncFn()
      .then((result) => {
        if (!cancelled && isMountedRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled && isMountedRef.current) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled  = true;
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

export default useAsync;
import { useEffect, useRef } from 'react';

export function useAdminDataRefresh(refresh: () => void | Promise<void>) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const handleDataChanged = () => {
      Promise.resolve(refreshRef.current()).catch((error: unknown) => {
        console.error('Failed to refresh admin data after a live update:', error);
      });
    };

    window.addEventListener('admin:data:changed', handleDataChanged);
    return () => window.removeEventListener('admin:data:changed', handleDataChanged);
  }, []);
}

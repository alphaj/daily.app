import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useGoBack(fallback = '/history') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
  }, [router, fallback]);
}

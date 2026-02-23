type ToastPayload = {
  emoji: string;
  title: string;
  message: string;
};

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();

export function showToast(payload: ToastPayload) {
  listeners.forEach((fn) => fn(payload));
}

export function onToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

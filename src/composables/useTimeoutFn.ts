import { ref, onScopeDispose, getCurrentScope, type Ref } from 'vue';

export interface UseTimeoutFnReturn<TArgs extends unknown[] = unknown[]> {
  readonly isPending: Readonly<Ref<boolean>>;
  readonly start: (...args: TArgs) => void;
  readonly stop: () => void;
}

/**
 * Self-cleaning timer composable adhering to Chemical X timer discipline.
 * Automatically disposes timers when the calling component/composable unmounts.
 */
export function useTimeoutFn<TArgs extends unknown[] = unknown[]>(
  cb: (...args: TArgs) => void,
  interval: number
): UseTimeoutFnReturn<TArgs> {
  const isPending = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    isPending.value = false;
  };

  const start = (...args: TArgs): void => {
    stop();
    isPending.value = true;
    timer = setTimeout(() => {
      isPending.value = false;
      timer = null;
      cb(...args);
    }, interval);
  };

  if (getCurrentScope()) {
    onScopeDispose(stop);
  }

  return {
    isPending,
    start,
    stop
  };
}

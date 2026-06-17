import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";

type ApiQueryState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => Promise<void>;
};

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
): ApiQueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  const reloadKey = JSON.stringify(deps);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setData(await fetcherRef.current());
    } catch (caught) {
      setData(null);
      setError(
        caught instanceof Error
          ? caught
          : new Error("Erro inesperado ao carregar dados."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload, reloadKey]);

  return { data, error, isLoading, reload };
}

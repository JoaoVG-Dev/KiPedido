import { useCallback, useEffect, useState, type DependencyList } from 'react'

type ApiQueryState<T> = {
  data: T | null
  error: Error | null
  isLoading: boolean
  reload: () => Promise<void>
}

export function useApiQuery<T>(fetcher: () => Promise<T>, deps: DependencyList = []): ApiQueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setData(await fetcher())
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('Erro inesperado ao carregar dados.'))
    } finally {
      setIsLoading(false)
    }
  }, deps)

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, isLoading, reload }
}

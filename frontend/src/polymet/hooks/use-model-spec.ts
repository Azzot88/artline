
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { ModelUISpec } from "@/polymet/data/api-types"

export function useModelSpec(modelId: string | null) {
  const [spec, setSpec] = useState<ModelUISpec | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!modelId) {
      setSpec(null)
      return
    }

    let mounted = true

    async function fetchSpec() {
      setLoading(true)
      try {
        const data = await api.get<ModelUISpec>(`/models/${modelId}/ui-spec`)
        if (mounted) {
          setSpec(data)
          setError(null)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load model parameters")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchSpec()

    return () => { mounted = false }
  }, [modelId])

  return { spec, loading, error }
}

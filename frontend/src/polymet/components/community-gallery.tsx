import { useState, useEffect, useRef, useCallback } from "react"
import { GenerationCard } from "@/polymet/components/generation-card"
import { SparklesIcon, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useLanguage } from "@/polymet/components/language-provider"
import { api } from "@/lib/api"
import { Generation } from "@/polymet/data/types"
import { GenerationDetailsDialog } from "@/polymet/components/generation-details-dialog"

interface CommunityGalleryProps {
  onUsePrompt?: (prompt: string) => void
}

export function CommunityGallery({ onUsePrompt }: CommunityGalleryProps) {
  const { t } = useLanguage()
    // ... (rest of state)
    // pass onUsePrompt to dialog
    < GenerationDetailsDialog
  open = { detailsOpen }
  onOpenChange = { setDetailsOpen }
  generation = { selectedGeneration }
  onDelete = {(id) => {
    setGenerations(prev => prev.filter(g => g.id !== id))
  }
}
onUsePrompt = { onUsePrompt }
  />
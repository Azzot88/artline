import { useState } from "react"
import { generations } from "@/polymet/data/generations-data"
import { GenerationCard } from "@/polymet/components/generation-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  SearchIcon
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "@/polymet/components/language-provider"

export function Gallery() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterModel, setFilterModel] = useState("all")
  const [filterProvider, setFilterProvider] = useState("all")
  const t = useTranslations()

  // Filter generations
  const filteredGenerations = generations.filter(gen => {
    const matchesSearch = gen.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesModel = filterModel === "all" || gen.model === filterModel
    const matchesProvider = filterProvider === "all" || gen.provider === filterProvider
    return matchesSearch && matchesModel && matchesProvider
  })

  // Get unique models and providers for filters
  const uniqueModels = Array.from(new Set(generations.map(g => g.model)))
  const uniqueProviders = Array.from(new Set(generations.map(g => g.provider)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {t.gallery}
        </h1>
        <p className="text-muted-foreground">
          {t.communityGallery}
        </p>
      </div>



      {/* Masonry Gallery */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {filteredGenerations.map((gen) => (
          <GenerationCard key={gen.id} generation={gen} />
        ))}
      </div>

      {/* Empty State */}
      {filteredGenerations.length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <SearchIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t.noGenerations}</h3>
            <p className="text-sm text-muted-foreground">
              Попробуйте изменить параметры поиска или фильтры
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("")
                setFilterModel("all")
                setFilterProvider("all")
              }}
            >
              Очистить фильтры
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
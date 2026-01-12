import { BrowserRouter } from "react-router-dom"
import { GenerationCard } from "@/polymet/components/generation-card"
import { generations } from "@/polymet/data/generations-data"

export default function GenerationCardRender() {
  return (
    <BrowserRouter>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Generation Card Component</h2>
            <p className="text-muted-foreground">
              Карточка генерации с превью и детальным модальным окном
            </p>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {generations.slice(0, 6).map((gen) => (
              <GenerationCard key={gen.id} generation={gen} />
            ))}
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}
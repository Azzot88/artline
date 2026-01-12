import { BrowserRouter } from "react-router-dom"
import { generations, getPublicGenerations } from "@/polymet/data/generations-data"
import { HeartIcon, CoinsIcon } from "lucide-react"

export default function GenerationsDataRender() {
  const publicGens = getPublicGenerations()

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">Generated Images ({publicGens.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicGens.slice(0, 6).map(gen => (
            <div key={gen.id} className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted relative">
                <img 
                  src={gen.url} 
                  alt={gen.prompt} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm line-clamp-2">{gen.prompt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <img src={gen.userAvatar} alt={gen.userName} className="w-5 h-5 rounded-full" />
                    <span>{gen.userName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <HeartIcon className="w-3 h-3" />
                      {gen.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <CoinsIcon className="w-3 h-3" />
                      {gen.credits}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {gen.model} • {gen.provider}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserRouter>
  )
}
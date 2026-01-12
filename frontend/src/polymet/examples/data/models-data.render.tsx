import { aiModels, providers, getModelsByProvider, getModelById } from "@/polymet/data/models-data"

export default function ModelsDataRender() {
  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Providers</h2>
        <div className="grid gap-4">
          {providers.map(provider => (
            <div key={provider.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={provider.logo} alt={provider.name} className="w-10 h-10 rounded" />
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {provider.modelsCount} models • {provider.totalGenerations.toLocaleString()} generations
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  provider.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {provider.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">AI Models</h2>
        <div className="grid gap-4">
          {aiModels.map(model => (
            <div key={model.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{model.name}</h3>
                  <p className="text-sm text-muted-foreground">{model.provider}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                    {model.credits} credits
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    model.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                    model.status === 'maintenance' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-gray-500/10 text-gray-500'
                  }`}>
                    {model.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{model.description}</p>
              <div className="flex flex-wrap gap-1">
                {model.capabilities.map(cap => (
                  <span key={cap} className="text-xs px-2 py-0.5 rounded bg-muted">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
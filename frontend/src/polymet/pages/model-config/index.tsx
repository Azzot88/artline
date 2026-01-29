
import { useParams } from "react-router-dom"
import { ModelEditor } from "./components/ModelEditor"

export function ModelConfig() {
    const { modelId } = useParams()

    if (!modelId) return <div>Model ID Missing</div>

    return (
        <div className="h-[calc(100vh-64px)] p-6">
            <ModelEditor modelId={modelId} />
        </div>
    )
}

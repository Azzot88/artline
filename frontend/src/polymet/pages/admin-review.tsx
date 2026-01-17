import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useLanguage } from "@/polymet/components/language-provider"

interface ReviewJob {
    id: string
    prompt: string
    result_url: string
    created_at: string
    model_id: string
    user_id: string
}

export function AdminReview() {
    const { t } = useLanguage()
    const [jobs, setJobs] = useState<ReviewJob[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchJobs()
    }, [])

    const fetchJobs = async () => {
        try {
            setLoading(true)
            const data = await api.get<ReviewJob[]>("/admin/review")
            setJobs(data)
        } catch (e) {
            console.error("Failed to fetch review jobs", e)
            toast.error("Failed to load review queue")
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = (id: string) => {
        console.log("Approving job:", id)
        toast.success("Job approved (Mockup)")
        // Optimistic remove
        setJobs(jobs.filter(j => j.id !== id))
    }

    const handleReject = (id: string) => {
        console.log("Rejecting job:", id)
        toast.success("Job rejected (Mockup)")
        // Optimistic remove
        setJobs(jobs.filter(j => j.id !== id))
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Review Queue</h1>
                <Badge variant="outline">{jobs.length} Pending</Badge>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This is a mockup ("Fish") page. Actions here are visual only for now.
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">No submissions pending review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <Card key={job.id} className="p-4 flex flex-col md:flex-row gap-4 items-start">
                            {/* Image */}
                            <div className="w-full md:w-48 aspect-square bg-muted rounded-md overflow-hidden flex-shrink-0">
                                <img src={job.result_url} className="w-full h-full object-cover" alt="Generation" />
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-2">
                                <div className="text-xs text-muted-foreground font-mono">{job.id}</div>
                                <p className="font-medium text-sm line-clamp-3">{job.prompt}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{new Date(job.created_at).toLocaleString()}</span>
                                    <span>Model: {job.model_id}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                                <Button size="sm" onClick={() => handleApprove(job.id)} className="w-full md:w-32 bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReject(job.id)} className="w-full md:w-32">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

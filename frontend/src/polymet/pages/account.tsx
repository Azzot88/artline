import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CoinsIcon,
  CreditCardIcon,
  UserIcon,
  CalendarIcon,
  TrendingUpIcon,
  ImageIcon,
  VideoIcon,
  DownloadIcon,
  GlobeIcon,
  Loader2Icon,
  HistoryIcon
} from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
// Removed LanguageSelector
import { useAuth } from "@/polymet/components/auth-provider"
import { api } from "@/lib/api"
import { JobRead } from "@/polymet/data/api-types"
import { formatDate } from "@/polymet/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function Account() {
  const { user, isLoading: userLoading } = useAuth()
  const { t, language, setLanguage } = useLanguage()

  // Local state for profile form (initializing from user when readily available)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [selectedJob, setSelectedJob] = useState<JobRead | null>(null)

  // Jobs state
  const [jobs, setJobs] = useState<JobRead[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setName(user.username || user.email?.split('@')[0] || "")
      setEmail(user.email || "")
    }
  }, [user])

  // Fetch all jobs for stats
  useEffect(() => {
    async function fetchJobs() {
      try {
        setJobsLoading(true)
        // Fetch ALL jobs to calculate accurate stats
        const data = await api.get<JobRead[]>("/jobs?limit=1000")
        setJobs(data || [])
      } catch (error) {
        console.error("Failed to fetch jobs:", error)
        setJobs([])
      } finally {
        setJobsLoading(false)
      }
    }

    if (user) {
      fetchJobs()
    }
  }, [user])

  // Calculate Stats
  const stats = useMemo(() => {
    if (!jobs.length) {
      return {
        imageCount: 0,
        videoCount: 0,
        totalGenerations: user?.total_generations || 0,
        creditsUsed: 0, // No backend field for this yet, so we sum from local jobs
        avgCost: 0
      }
    }

    // Filter successful/relevant jobs if needed, or count all
    const imageCount = jobs.filter(j => j.kind === 'image').length
    const videoCount = jobs.filter(j => j.kind === 'video').length

    // Sum cost_credits from jobs
    const creditsUsed = jobs.reduce((sum, job) => sum + (job.credits_spent || job.cost_credits || 0), 0)

    // Total generations from user object is likely more accurate for lifetime, 
    // but for breakdown we rely on fetched jobs.
    // Let's use user.total_generations if available and > jobs.length, else jobs.length
    const totalGenerations = Math.max(user?.total_generations || 0, jobs.length)

    const avgCost = totalGenerations > 0 ? Math.round(creditsUsed / totalGenerations) : 0

    return {
      imageCount,
      videoCount,
      totalGenerations, // fallback to 0 handled above
      creditsUsed,
      avgCost
    }
  }, [jobs, user])

  if (userLoading) {
    return <div className="flex justify-center py-20"><Loader2Icon className="animate-spin w-8 h-8 text-muted-foreground" /></div>
  }

  if (!user) {
    return <div className="text-center py-20 text-muted-foreground">Please log in to view account details.</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">
          {t('account.title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('account.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Profile & Settings */}
        <div className="lg:col-span-2 space-y-8">

          {/* 1. Profile Card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">{t('account.profile')}</CardTitle>
              <CardDescription>{t('account.manageInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-2xl bg-secondary/50 flex items-center justify-center border-2 border-dashed border-border group relative overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="grid gap-4 flex-1 w-full md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Username</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-background/50"
                      readOnly // Read-only for now until update endpoint exists
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg w-fit">
                <CalendarIcon className="w-4 h-4" />
                <span>{t('account.memberSince')} {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
              </div>

              <div className="flex gap-3">
                <Button disabled>{t('common.save')}</Button>
                {/* Disabled until we implement update profile */}
              </div>
            </CardContent>
          </Card>

          {/* 2. History / Transactions (Derived from jobs) */}
          <Card className="border-border/50 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <HistoryIcon className="w-5 h-5" />
                {t('navigation.history')}
              </CardTitle>
              <CardDescription>{t('account.recentActivity')}</CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="py-8 flex justify-center"><Loader2Icon className="animate-spin w-6 h-6 text-muted-foreground" /></div>
              ) : jobs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm border border-dashed rounded-lg bg-secondary/20">
                  No activity yet. Start generating!
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Show last 20 jobs as history */}
                  {jobs.slice(0, 20).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-border/50"
                      onClick={() => setSelectedJob(job)}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-md bg-secondary/30 overflow-hidden flex-shrink-0 border border-border/50 relative">
                        {job.result_url ? (
                          <img src={job.result_url} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {job.kind === 'video' ? <VideoIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                          </div>
                        )}
                        {job.kind === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><VideoIcon className="w-4 h-4 text-white drop-shadow-md" /></div>}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 grid gap-1">
                        <p className="text-sm font-medium leading-none truncate pr-2 group-hover:text-primary transition-colors">{job.prompt}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {job.format && <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-[4px] font-normal text-muted-foreground">{job.format}</Badge>}
                          {job.resolution && <span>{job.resolution}</span>}
                          <span className="opacity-50">•</span>
                          <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Cost */}
                      <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        <span className="text-orange-500 font-bold">-{job.credits_spent || job.cost_credits || 0}</span> cr
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Language */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <GlobeIcon className="w-5 h-5" />
                {t('account.language')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'ru', label: 'Русский' },
                  { code: 'kk', label: 'Қазақша' },
                  { code: 'ky', label: 'Кыргызча' }
                ].map((lang) => (
                  <Button
                    key={lang.code}
                    variant={language === lang.code ? "default" : "outline"}
                    onClick={() => setLanguage(lang.code as any)}
                    className={language === lang.code ? "bg-primary text-primary-foreground" : ""}
                    size="sm"
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column - Stats & Credits */}
        <div className="space-y-6">

          {/* Credits Balance */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <CoinsIcon className="w-32 h-32" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CoinsIcon className="w-5 h-5 text-primary" />
                {t('account.creditBalance')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="text-center py-2">
                <div className="text-6xl font-bold text-primary mb-2 tracking-tighter">
                  {user.balance.toLocaleString()}
                </div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('account.credits')}</p>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-11 text-base shadow-md shadow-primary/20 transition-all hover:scale-[1.02]" size="lg">
                  <CreditCardIcon className="w-4 h-4 mr-2" />
                  {t('account.buyMore')}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t('account.avgCost')}: <span className="font-mono text-foreground">{stats.avgCost}</span> {t('account.credits')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5" />
                {t('account.quickStats')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium display-block">{t('common.image')}</span>
                      <span className="text-xs text-muted-foreground"></span>
                    </div>
                  </div>
                  <span className="text-xl font-bold">{stats.imageCount}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <VideoIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium display-block">{t('common.video')}</span>
                      <span className="text-xs text-muted-foreground"></span>
                    </div>
                  </div>
                  <span className="text-xl font-bold">{stats.videoCount}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-muted-foreground">{t('account.creditsUsed')}</span>
                  <span className="text-lg font-bold font-mono">{stats.creditsUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{t('dashboard.totalGenerations')}</span>
                  <span className="text-lg font-bold font-mono">{stats.totalGenerations}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <DownloadIcon className="w-4 h-4 mr-2" />
                {t('account.downloadArchive')}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">{t('account.plan')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant={user.is_admin ? "default" : "secondary"} className="text-sm px-3 py-1">
                  {user.is_admin ? t('account.plans.admin') : t('account.plans.free')}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {t('account.plans.upgradeDesc')}
              </p>
              <Button variant="outline" className="w-full" size="sm">
                {t('account.plans.upgradeBtn')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox Preview */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {selectedJob?.kind === 'image' && selectedJob.result_url && (
              <img
                src={selectedJob.result_url}
                alt={selectedJob.prompt}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
            {selectedJob?.kind === 'video' && selectedJob.result_url && (
              <video
                src={selectedJob.result_url}
                controls
                autoPlay
                loop
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
            )}
            {!selectedJob?.result_url && (
              <div className="p-8 bg-background text-foreground rounded-lg">Preview not available</div>
            )}
          </div>
          {selectedJob && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-2 rounded-full text-sm">
              {selectedJob.resolution} • {selectedJob.format}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
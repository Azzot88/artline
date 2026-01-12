import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getGenerationById } from "@/polymet/data/generations-data"
import { useLanguage } from "@/polymet/components/language-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { 
  HeartIcon, 
  CoinsIcon,
  DownloadIcon,
  Share2Icon,
  CalendarIcon,
  ImageIcon,
  SparklesIcon,
  ArrowLeftIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  PlayIcon
} from "lucide-react"

export function InstanceDetail() {
  const { instanceId = "gen-001" } = useParams()
  const { t } = useLanguage()
  const generation = getGenerationById(instanceId)

  const [isLiked, setIsLiked] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState(generation?.prompt || "")

  if (!generation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ImageIcon className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">{t.notFound}</h2>
        <p className="text-muted-foreground">{t.instance} не найден</p>
        <Button asChild>
          <Link to="/gallery">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {t.gallery}
          </Link>
        </Button>
      </div>
    )
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleDownload = () => {
    console.log("Downloading:", generation.id)
    // Download logic here
  }

  const handleShare = () => {
    console.log("Sharing:", generation.id)
    // Share logic here
  }

  const handleSaveEdit = () => {
    console.log("Saving edited prompt:", editedPrompt)
    setIsEditing(false)
    // Save logic here
  }

  const handleCancelEdit = () => {
    setEditedPrompt(generation.prompt)
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/gallery">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {t.gallery}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {generation.type === "image" ? t.image : t.video}
          </Badge>
          <Badge variant="outline">
            {generation.model}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image/Video */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-muted flex items-center justify-center">
                {generation.type === "video" ? (
                  <div className="relative w-full" style={{ aspectRatio: `${generation.width}/${generation.height}` }}>
                    <img 
                      src={generation.url} 
                      alt={generation.prompt}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button size="lg" className="rounded-full w-16 h-16">
                        <PlayIcon className="w-8 h-8" />
                      </Button>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary/90 backdrop-blur-sm">
                        <SparklesIcon className="w-3 h-3 mr-1" />
                        Видео
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={generation.url} 
                    alt={generation.prompt}
                    className="w-full h-auto object-contain"
                    style={{ aspectRatio: `${generation.width}/${generation.height}` }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Button 
              onClick={handleLike}
              variant={isLiked ? "default" : "outline"}
              className="flex-1 min-w-[120px]"
            >
              <HeartIcon className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {isLiked ? "Понравилось" : "Нравится"}
            </Button>
            <Button 
              variant="outline"
              onClick={handleDownload}
              className="flex-1 min-w-[120px]"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {t.download}
            </Button>
            <Button 
              variant="outline"
              onClick={handleShare}
              className="flex-1 min-w-[120px]"
            >
              <Share2Icon className="w-4 h-4 mr-2" />
              Поделиться
            </Button>
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={generation.userAvatar} 
                  alt={generation.userName}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold">{generation.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(generation.createdAt)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HeartIcon className="w-4 h-4" />
                    <span className="text-sm">{t.likes}</span>
                  </div>
                  <span className="font-semibold">{generation.likes + (isLiked ? 1 : 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CoinsIcon className="w-4 h-4" />
                    <span className="text-sm">{t.credits}</span>
                  </div>
                  <span className="font-semibold">{generation.credits}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prompt */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Промпт</h3>
                {!isEditing && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <EditIcon className="w-3.5 h-3.5 mr-1" />
                    {t.edit}
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="min-h-32"
                    placeholder="Введите промпт..."
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleSaveEdit}
                      className="flex-1"
                    >
                      <SaveIcon className="w-3.5 h-3.5 mr-1" />
                      {t.save}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1"
                    >
                      <XIcon className="w-3.5 h-3.5 mr-1" />
                      {t.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{generation.prompt}</p>
              )}
            </CardContent>
          </Card>

          {/* Generation Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Детали генерации</h3>
              
              <div className="space-y-3">
                {/* Model */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="text-sm">{t.model}</span>
                  </div>
                  <span className="text-sm font-medium text-right">{generation.model}</span>
                </div>

                {/* Provider */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Провайдер</span>
                  </div>
                  <span className="text-sm font-medium text-right">{generation.provider}</span>
                </div>

                {/* Resolution */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">{t.resolution}</span>
                  </div>
                  <span className="text-sm font-medium text-right">{generation.width}×{generation.height}</span>
                </div>

                {/* Type */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Тип</span>
                  </div>
                  <span className="text-sm font-medium text-right">
                    {generation.type === "image" ? t.image : t.video}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-sm">Создано</span>
                  </div>
                  <span className="text-sm font-medium text-right">{formatDate(generation.createdAt)}</span>
                </div>
              </div>

              {/* Curated Badge */}
              {generation.isCurated && (
                <div className="pt-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 w-full justify-center">
                    <SparklesIcon className="w-3 h-3 mr-1" />
                    Избранное сообщества
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
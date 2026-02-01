import { useState } from "react"
import { RoleCard } from "@/polymet/components/team/role-card"
import { NewRoleCard } from "@/polymet/components/team/new-role-card"
import { RoleEditor } from "@/polymet/components/team/role-editor"
import { AnimatePresence, motion } from "framer-motion"

// Mock Data
const MOCK_ROLES = [
    {
        id: "1",
        name: "Cinematic Director",
        description: "Specializes in wide shots, dramatic lighting, and film grain textures.",
        style: "Film Noir",
        isActive: true
    },
    {
        id: "2",
        name: "Anime Artist",
        description: "Creates vibrant 2D anime style characters with cel shading.",
        style: "Studio Ghibli",
        isActive: false
    },
    {
        id: "3",
        name: "Product Photographer",
        description: "Clean studio lighting focus on objects with macro capabilities.",
        style: "Commercial",
        isActive: true
    }
]

export function TeamPage() {
    const [selectedRole, setSelectedRole] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const handleRoleClick = (id: string) => {
        if (selectedRole === id) {
            setSelectedRole(null) // Deselect if already selected
        } else {
            setSelectedRole(id)
            setIsCreating(false)
        }
    }

    const handleCreateClick = () => {
        setIsCreating(true)
        setSelectedRole(null)
    }

    const handleCloseEditor = () => {
        setSelectedRole(null)
        setIsCreating(false)
    }

    const activeRole = MOCK_ROLES.find(r => r.id === selectedRole)

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Team</h1>
                <p className="text-muted-foreground">
                    Manage your AI specialists and define their generation styles.
                </p>
            </div>

            {/* Editor Section - Expands at top */}
            <AnimatePresence mode="wait">
                {(selectedRole || isCreating) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <RoleEditor
                            role={activeRole}
                            onClose={handleCloseEditor}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Block - Always First */}
                <NewRoleCard onClick={handleCreateClick} />

                {/* Roles List */}
                {MOCK_ROLES.map((role) => (
                    <RoleCard
                        key={role.id}
                        role={role}
                        onClick={() => handleRoleClick(role.id)}
                        isSelected={selectedRole === role.id}
                    />
                ))}
            </div>
        </div>
    )
}

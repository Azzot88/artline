import { ReactNode } from "react"

interface ModelConfigLayoutProps {
    header: ReactNode
    main: ReactNode
    sidebar: ReactNode
}

export function ModelConfigLayout({ header, main, sidebar }: ModelConfigLayoutProps) {
    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-6 pb-24 max-w-7xl">
            {/* Sticky Header Area */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-8 px-8 border-b">
                {header}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (2 Columns) */}
                <div className="lg:col-span-2 space-y-8">
                    {main}
                </div>

                {/* Sidebar (1 Column) */}
                <div className="space-y-6">
                    {sidebar}
                </div>
            </div>
        </div>
    )
}

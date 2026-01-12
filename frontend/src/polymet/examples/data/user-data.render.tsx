import { BrowserRouter } from "react-router-dom"
import { currentUser, mockUsers, mockLedgerEntries, getUserById, getUserLedger, calculateUserBalance } from "@/polymet/data/user-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CoinsIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"

export default function UserDataRender() {
  const user = currentUser
  const ledger = getUserLedger(user.id)

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">User Data Types</h2>
          <p className="text-muted-foreground">
            Backend-aligned user, ledger, and like types with mock data
          </p>
        </div>

        {/* Current User */}
        <Card>
          <CardHeader>
            <CardTitle>Current User Profile</CardTitle>
            <CardDescription>Authenticated user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <img 
                src={user.avatar_url} 
                alt={user.username} 
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{user.username}</h3>
                  {user.is_admin && (
                    <Badge variant="default">Admin</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CoinsIcon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{user.balance} credits</span>
                  </div>
                  <span className="text-muted-foreground">
                    {user.total_generations} generations
                  </span>
                  <span className="text-muted-foreground">
                    Language: {user.language.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent ledger entries for {user.username}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ledger.map(entry => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {entry.amount > 0 ? (
                      <TrendingUpIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingDownIcon className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{entry.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${entry.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {entry.amount > 0 ? '+' : ''}{entry.amount} credits
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {entry.balance_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Users */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Mock user database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockUsers.map(u => (
                <div 
                  key={u.id} 
                  className="flex items-center gap-3 p-3 border border-border rounded-lg"
                >
                  <img 
                    src={u.avatar_url} 
                    alt={u.username} 
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{u.username}</p>
                      {u.is_admin && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {u.balance} credits • {u.total_generations} gens
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}

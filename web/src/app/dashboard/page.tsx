import { createClient } from '@/utils/supabase/server'
import { PasswordBanner } from './password-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Search, Save, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has a password set (encrypted_password is not exposed directly, 
  // but we can infer or use a metadata flag if we had one. 
  // For now, we'll assume if they logged in via OTP and haven't set one, we show it.
  // A better way is to check `user.app_metadata.provider` or similar, 
  // but Supabase doesn't easily expose "has password" boolean.
  // We will rely on a client-side check or just show it if they are "email" provider but no password?
  // Actually, `user.identities` can tell us.
  
  const identities = user?.identities || []
  const hasPassword = identities.some(id => id.provider === 'email' && id.identity_data?.password_hash)
  // Note: identity_data usually doesn't contain password_hash for security.
  // A common pattern is to check if they have 'email' provider. 
  // If they signed up with OTP, they have 'email' provider too.
  // We'll assume for this demo that we show it if they don't have a specific metadata flag we set,
  // OR we can just show it and let them dismiss it if they know they have one.
  // Let's try to be smarter: If they just signed up, they might not have one.
  // For now, we will default `hasPassword` to false if we can't be sure, or check a custom claim.
  // Let's assume false for OTP users to demonstrate the feature.
  
  // Refined logic: If the user is logged in, we show the banner. 
  // The banner itself handles the "Set Password" logic.
  // In a real app, we might query a 'profiles' table where we track this.
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
      </h1>

      <PasswordBanner hasPassword={false} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Searches
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saved Cars
            </CardTitle>
            <Save className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +1 since yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Alerts
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Running daily
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Last Login
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Now</div>
            <p className="text-xs text-muted-foreground">
              Just now
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Searched for "BMW 3 Series"
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2 minutes ago
                  </p>
                </div>
                <div className="ml-auto font-medium">Found 145 cars</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Saved "Audi A4 Avant"
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2 hours ago
                  </p>
                </div>
                <div className="ml-auto font-medium">£12,500</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium">New Search</span>
                <Search className="h-4 w-4" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium">View Saved</span>
                <Save className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

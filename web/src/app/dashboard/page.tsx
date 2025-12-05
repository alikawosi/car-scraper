import { createClient } from '@/utils/supabase/server'
import { PasswordBanner } from './password-banner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Search, Save, Clock, ArrowRight, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Previous logic for password banner visibility
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-foreground font-display">
          Welcome back{user?.email ? <span className="text-motovotive-red">, {user.email.split('@')[0]}</span> : ''}
        </h1>
        <p className="text-muted-foreground font-medium">Here's what's happening with your car search today.</p>
      </div>

      <PasswordBanner hasPassword={false} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-motovotive-red">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-display">
              Total Searches
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <Search className="h-4 w-4 text-motovotive-red" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground font-display">12</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              <span className="text-green-600 font-bold">+2</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-motovotive-orange">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-display">
              Saved Cars
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
              <Save className="h-4 w-4 text-motovotive-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground font-display">3</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              <span className="text-green-600 font-bold">+1</span> since yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-display">
              Active Alerts
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground font-display">1</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Running daily
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
              Status
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white font-display">Active</div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Pro Plan
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="font-display text-xl font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors">
                 <div className="w-10 h-10 rounded-full bg-motovotive-red/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Search className="w-5 h-5 text-motovotive-red" />
                 </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold leading-none text-foreground flex items-center gap-2">
                    Searched for "BMW 3 Series"
                    <Badge variant="outline" className="text-[10px] h-5">NEW</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    2 minutes ago
                  </p>
                </div>
                <div className="ml-auto font-mono text-sm font-bold text-motovotive-red">145 Results</div>
              </div>

              <div className="flex items-center group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors">
                 <div className="w-10 h-10 rounded-full bg-motovotive-orange/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Save className="w-5 h-5 text-motovotive-orange" />
                 </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold leading-none text-foreground">
                    Saved "Audi A4 Avant"
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    2 hours ago
                  </p>
                </div>
                <div className="ml-auto font-display text-sm font-bold">£12,500</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="font-display text-xl font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-motovotive-red hover:bg-red-50/50 hover:text-motovotive-red transition-all group">
                <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Start New Search</span>
                <Search className="h-4 w-4 text-slate-400 group-hover:text-motovotive-red" />
              </button>
              <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-motovotive-orange hover:bg-orange-50/50 hover:text-motovotive-orange transition-all group">
                <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">View Saved Cars</span>
                <Save className="h-4 w-4 text-slate-400 group-hover:text-motovotive-orange" />
              </button>
              <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 hover:text-slate-900 transition-all group">
                <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Manage Alerts</span>
                <Activity className="h-4 w-4 text-slate-400 group-hover:text-slate-900" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

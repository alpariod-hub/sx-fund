import { Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Pools from "@/pages/Pools";
import PoolDetail from "@/pages/PoolDetail";
import Assets from "@/pages/Assets";
import AssetDetail from "@/pages/AssetDetail";
import OracleFeed from "@/pages/OracleFeed";
import Investors from "@/pages/Investors";
import Deals from "@/pages/Deals";
import DealDetail from "@/pages/DealDetail";
import Accounting from "@/pages/Accounting";
import Legal from "@/pages/Legal";
import Team from "@/pages/Team";
import Settings from "@/pages/Settings";
import Security from "@/pages/Security";
import Escrow from "@/pages/Escrow";
import Workspace from "@/pages/Workspace";
import Financing from "@/pages/Financing";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/pools" component={Pools} />
          <Route path="/pools/:id" component={PoolDetail} />
          <Route path="/deals" component={Deals} />
          <Route path="/deals/:id" component={DealDetail} />
          <Route path="/assets" component={Assets} />
          <Route path="/assets/:id" component={AssetDetail} />
          <Route path="/oracle" component={OracleFeed} />
          <Route path="/investors" component={Investors} />
          <Route path="/accounting" component={Accounting} />
          <Route path="/legal" component={Legal} />
          <Route path="/team" component={Team} />
          <Route path="/settings" component={Settings} />
          <Route path="/security" component={Security} />
          <Route path="/escrow" component={Escrow} />
          <Route path="/workspace" component={Workspace} />
          <Route path="/financing" component={Financing} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

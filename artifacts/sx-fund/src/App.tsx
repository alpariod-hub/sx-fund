import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminGuard from "@/components/shared/AdminGuard";

import Landing from "@/pages/landing";
import DashboardPage from "@/pages/DashboardPage";
import Assets from "@/pages/assets";
import AssetDetail from "@/pages/asset-detail";
import Oracle from "@/pages/oracle";
import DealRoomsPage from "@/pages/DealRoomsPage";
import DealRoomDetail from "@/pages/DealRoomDetail";
import AccountingPage from "@/pages/AccountingPage";
import LegalPage from "@/pages/LegalPage";
import TeamPage from "@/pages/TeamPage";
import InvestorPage from "@/pages/InvestorPage";
import NewDealPage from "@/pages/NewDealPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function ProtectedRoutes() {
  return (
    <AdminGuard>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/assets" component={Assets} />
        <Route path="/assets/:id" component={AssetDetail} />
        <Route path="/oracle" component={Oracle} />
        <Route path="/rooms" component={DealRoomsPage} />
        <Route path="/rooms/:id" component={DealRoomDetail} />
        <Route path="/accounting" component={AccountingPage} />
        <Route path="/legal" component={LegalPage} />
        <Route path="/team" component={TeamPage} />
        <Route path="/investor" component={InvestorPage} />
        <Route path="/deals/new" component={NewDealPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AdminGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PublicRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

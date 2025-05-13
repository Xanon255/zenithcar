import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import NewJob from "@/pages/NewJob";
import ViewJob from "@/pages/ViewJob";
import Customers from "@/pages/Customers";
import Reports from "@/pages/Reports";
import PriceList from "@/pages/PriceList";
import VehicleList from "@/pages/VehicleList";
import Users from "@/pages/Users";
import Expenses from "@/pages/Expenses";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/new-job" component={NewJob} />
        <Route path="/new-job/:id" component={NewJob} />
        <Route path="/view-job/:id" component={ViewJob} />
        <Route path="/jobs" component={Dashboard} />
        <Route path="/jobs/:id" component={ViewJob} />
        <Route path="/customers" component={Customers} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/reports" component={Reports} />
        <Route path="/price-list" component={PriceList} />
        <Route path="/vehicle-list" component={VehicleList} />
        <Route path="/users" component={Users} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import NewJob from "@/pages/NewJob";
import ViewJob from "@/pages/ViewJob";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Reports from "@/pages/Reports";
import PriceList from "@/pages/PriceList";
import VehicleList from "@/pages/VehicleList";
import Users from "@/pages/Users";
import Expenses from "@/pages/Expenses";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import AuthPage from "@/pages/auth-page";

function Router() {
  return (
    <Switch>
      {/* Korumalı olmayan sayfalar */}
      <Route path="/auth">
        <AuthPage />
      </Route>

      {/* Korumalı sayfalar (oturum gerektirir) */}
      <ProtectedRoute path="/">
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/new-job">
        <Layout>
          <NewJob />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/new-job/:id">
        <Layout>
          <NewJob />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/view-job/:id">
        <Layout>
          <ViewJob />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/jobs">
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/jobs/:id">
        <Layout>
          <ViewJob />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/customers">
        <Layout>
          <Customers />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/customer/:id">
        <Layout>
          <CustomerDetail />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/expenses">
        <Layout>
          <Expenses />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/reports">
        <Layout>
          <Reports />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/price-list">
        <Layout>
          <PriceList />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/vehicle-list">
        <Layout>
          <VehicleList />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/users" adminOnly={true}>
        <Layout>
          <Users />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/profile">
        <Layout>
          <Profile />
        </Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/settings">
        <Layout>
          <Settings />
        </Layout>
      </ProtectedRoute>
      
      {/* 404 sayfası */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

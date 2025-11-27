import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { RoleProtectedRoute } from "@/lib/role-protected-route";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/Home";
import History from "@/pages/History";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import UserManagement from "@/pages/UserManagement";
import ActivityLogs from "@/pages/ActivityLogs";
import UserDashboard from "@/pages/UserDashboard";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/dashboard" component={UserDashboard} />
      <ProtectedRoute path="/history" component={History} />
      <ProtectedRoute path="/about" component={About} />
      <RoleProtectedRoute path="/admin" component={Admin} requiredRole="manager" />
      <RoleProtectedRoute path="/admin/users" component={UserManagement} requiredRole="admin" />
      <RoleProtectedRoute path="/admin/activity" component={ActivityLogs} requiredRole="manager" />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="adsc-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

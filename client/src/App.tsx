import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import WorkoutSession from "@/pages/workout";
import History from "@/pages/history";
import Profile from "@/pages/profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/workout" component={WorkoutSession}/>
      <Route path="/history" component={History}/>
      <Route path="/profile" component={Profile}/>
      <Route component={NotFound} />
    </Switch>
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

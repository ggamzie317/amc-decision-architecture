import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AmcWebMvp from "./pages/AmcWebMvp";
import AmcAdmin from "./pages/AmcAdmin";
import Home from "./pages/Home";

function LegacyProductRedirect() {
  return <Redirect to="/amc-web-mvp" replace />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/amc-web-mvp"} component={AmcWebMvp} />
      <Route path={"/amc-admin"} component={AmcAdmin} />
      <Route path={"/intake"} component={LegacyProductRedirect} />
      <Route path={"/format-handoff"} component={LegacyProductRedirect} />
      <Route path={"/payment-handoff"} component={LegacyProductRedirect} />
      <Route path={"/payment-success"} component={LegacyProductRedirect} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

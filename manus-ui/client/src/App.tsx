import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AmcWebMvp from "./pages/AmcWebMvp";
import AmcInteractiveV2 from "./pages/AmcInteractiveV2";
import AmcAdmin from "./pages/AmcAdmin";

// The legacy /amc-web-mvp page and its old aliases are retired (owner decision
// 2026-10-16); they open V2 instead. vercel.json redirects them server-side too.
function LegacyProductRedirect() {
  return <Redirect to={`/amc-interactive-v2${typeof window === "undefined" ? "" : window.location.search}`} replace />;
}

function Router() {
  return (
    <Switch>
      {/* The customer entry point is V2 (owner decision 2026-10-14); keep ?lang. */}
      <Route path={"/"}>{() => <Redirect to={`/amc-interactive-v2${typeof window === "undefined" ? "" : window.location.search}`} />}</Route>
      <Route path={"/amc-web-mvp"} component={LegacyProductRedirect} />
      <Route path="/amc-interactive-v2" component={AmcInteractiveV2} />
      <Route path="/amc-interactive-v1">{() => <AmcWebMvp key="interactive-v1" interactive />}</Route>
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

import { Redirect, Route, Switch } from "wouter";
import { BottomNav } from "@/components/bottom-nav";
import { ProtectedRoute } from "@/components/protected-route";
import CapturePage from "@/pages/capture";
import DashboardPage from "@/pages/dashboard";
import GalleryPage from "@/pages/gallery";
import InboxPage from "@/pages/inbox";
import LocationDetailPage from "@/pages/location-detail";
import NotFoundPage from "@/pages/not-found";
import SignInPage from "@/pages/sign-in";

export function App() {
  return (
    <>
      <Switch>
        <Route path="/">
          <Redirect to="/auth/sign-in" replace />
        </Route>
        <Route path="/auth/sign-in" component={SignInPage} />

        <Route path="/dashboard">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/capture">
          <ProtectedRoute>
            <CapturePage />
          </ProtectedRoute>
        </Route>
        <Route path="/inbox">
          <ProtectedRoute>
            <InboxPage />
          </ProtectedRoute>
        </Route>
        <Route path="/gallery">
          <ProtectedRoute>
            <GalleryPage />
          </ProtectedRoute>
        </Route>
        <Route path="/locations/:id">
          {(params) => (
            <ProtectedRoute>
              <LocationDetailPage id={params.id} />
            </ProtectedRoute>
          )}
        </Route>

        <Route component={NotFoundPage} />
      </Switch>
      <BottomNav />
    </>
  );
}

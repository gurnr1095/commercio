import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignedIn, SignedOut, SignIn, useAuth } from "@clerk/clerk-react";

import App from "./App";
import { queryClient } from "./lib/queryClient";
import { TokenContext } from "./lib/auth";
import "./index.css";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ClerkTokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  return <TokenContext.Provider value={getToken}>{children}</TokenContext.Provider>;
}

const appTree = (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {clerkKey ? (
      <ClerkProvider publishableKey={clerkKey}>
        <ClerkTokenProvider>
          <SignedIn>{appTree}</SignedIn>
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <SignIn routing="hash" />
            </div>
          </SignedOut>
        </ClerkTokenProvider>
      </ClerkProvider>
    ) : (
      appTree
    )}
  </React.StrictMode>,
);

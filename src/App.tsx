import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import JobsPage from "./pages/JobsPage";
import CandidatesPage from "./pages/CandidatesPage";
import CandidateDetailPage from "./pages/CandidateDetailPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import AssessmentBuilderPage from "./pages/AssessmentBuilderPage";
import AssessmentTakerPage from "./pages/AssessmentTakerPage";
import JobDetailPage from "./pages/JobDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/candidates/:id" element={<CandidateDetailPage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessments/builder/new" element={<AssessmentBuilderPage />} />
            <Route path="/assessments/builder/:id" element={<AssessmentBuilderPage />} />
            <Route path="/assessments/:id" element={<AssessmentTakerPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

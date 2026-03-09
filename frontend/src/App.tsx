import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "@/pages/AuthPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AuthGuard } from "@/components/AuthGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />

        <Route element={<AuthGuard />}>
          <Route path="/" element={<div>Home (protected)</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

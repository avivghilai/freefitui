import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import ClubPage from "@/pages/ClubPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/club/:id" element={<ClubPage />} />
    </Routes>
  );
}

import { Routes, Route } from "react-router"

import PageImageGenerate from "@/pages/pageImageGenerate.tsx"

export default function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<PageImageGenerate />} />

        <Route path="/image-generate" element={<PageImageGenerate />} />
    </Routes>
  );
}
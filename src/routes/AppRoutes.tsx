import { Routes, Route } from "react-router"

import PageImageGenerate from "@/pages/pageImageGenerate.tsx"
import PageInfo from "@/pages/pageInfo.tsx";

export default function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<PageImageGenerate />} />

        <Route path="/image-generate" element={<PageImageGenerate />} />
        <Route path="/info" element={<PageInfo />} />
    </Routes>
  );
}
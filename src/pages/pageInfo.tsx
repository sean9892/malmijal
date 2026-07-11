import { Navbar } from "@/components/Navbar/Navbar"
import { Info } from "@/components/Info/Info"

export default function PageImageGenerate() {
    return (
        <div className="grid h-dvh w-full grid-rows-[auto_minmax(0,1fr)]">
            <Navbar />
            <Info />
        </div>
    )
}
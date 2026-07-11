import { Navbar } from "@/components/Navbar/Navbar"
import { ImageGenerate } from "@/components/ImageGenerate/ImageGenerate"

export default function PageImageGenerate() {
    return (
        <div className="grid h-dvh w-full grid-rows-[auto_minmax(0,1fr)]">
            <Navbar />
            <ImageGenerate />
        </div>
    )
}
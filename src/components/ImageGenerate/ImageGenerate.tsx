import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { LeftPanel } from "./LeftPanel.tsx"
import { RightPanel } from "./RightPanel.tsx"

export function ImageGenerate() {
  return (
    <div className="min-h-0 w-full">
        <ResizablePanelGroup
        orientation="horizontal"
        className="w-full h-full"
        >
            <ResizablePanel defaultSize="50%">
                <div className="flex w-full items-center justify-center">
                    <LeftPanel />
                </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-slate-200 dark:bg-slate-700" />

            <ResizablePanel defaultSize="50%">
                <div className="flex w-full items-center justify-center">
                    <RightPanel />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    </div>
  )
}
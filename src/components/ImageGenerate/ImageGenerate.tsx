import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { LeftPanel } from "./LeftPanel.tsx"
import { RightPanel } from "./RightPanel.tsx"

export function ImageGenerate() {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full w-full"
      >
        <ResizablePanel
          defaultSize="50%"
          className="min-h-0 overflow-hidden"
        >
          <div className="flex h-full min-h-0 w-full items-center justify-center">
            <LeftPanel />
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-slate-200 dark:bg-slate-700"
        />

        <ResizablePanel
          defaultSize="50%"
          className="min-h-0 overflow-hidden"
        >
          <div className="flex h-full min-h-0 w-full items-center justify-center">
            <RightPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

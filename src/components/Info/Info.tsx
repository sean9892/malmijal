import { InfoIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Card } from "@/components/ui/card"

export function Info() {
  return (
    <main className="h-full min-h-0 w-full overflow-auto p-6">
      <Card className="mx-auto w-full max-w-3xl px-6">
        <h1 className="mb-4 text-3xl font-bold">Malmijal</h1>
        <Alert variant="default" className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>DJMAX 2차 창작물 안내</AlertTitle>
          <AlertDescription>
            본 사이트는 네오위즈의 DJMAX 게임 IP를 활용하여 제작된 비공식 팬 콘텐츠입니다.
          </AlertDescription>
        </Alert>
      </Card>
    </main>
  )
}

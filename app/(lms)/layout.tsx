import type { ReactNode } from "react"
import { LmsLayoutClient } from "@/components/lms-layout-client"

export default function LmsLayout({ children }: { children: ReactNode }) {
  return <LmsLayoutClient>{children}</LmsLayoutClient>
}

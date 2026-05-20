import { create } from 'zustand'
import type { PipelineWithStages } from '@/types'

interface PipelinesStore {
  pipelines: PipelineWithStages[]
  setPipelines: (pipelines: PipelineWithStages[]) => void
}

export const usePipelinesStore = create<PipelinesStore>()((set) => ({
  pipelines: [],
  setPipelines: (pipelines) => set({ pipelines }),
}))

export interface SlideImage {
  src: string
  alt: string
}

export interface ChartSeries {
  name: string
  values: number[]
}

export interface ChartData {
  labels: string[]
  series: ChartSeries[]
}

export interface Chart {
  type: string
  data: ChartData
}

export interface SlideRevealStep {
  text?: string
  items?: string[]
  image?: SlideImage
  charts?: Chart[]
}

export interface SlideColumn {
  title: string
  subtitle?: string
  items: string[]
  image?: SlideImage
  charts?: Chart[]
  references?: string[]
  reveal?: SlideRevealStep[]
  icon?: string
  flex: number
}

export interface Slide {
  id: string
  title: string
  subtitle?: string
  items: string[]
  image?: SlideImage
  charts?: Chart[]
  references?: string[]
  reveal?: SlideRevealStep[]
  icon?: string
  section?: string
  columns?: SlideColumn[]
}

export interface PresentationMeta {
  id: string
  title: string
  description?: string
  slideCount?: number
}

export interface ImportedPresentation {
  id: string
  title: string
  slides: Slide[]
}

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

export interface Slide {
  id: string
  title: string
  subtitle?: string
  items: string[]
  image?: SlideImage
  charts?: Chart[]
  section?: string
}

export interface PresentationMeta {
  id: string
  title: string
  description?: string
  slideCount?: number
}
export interface SlideImage {
  src: string
  alt: string
}

export interface Slide {
  id: string
  title: string
  subtitle?: string
  items: string[]
  image?: SlideImage
}

export interface PresentationMeta {
  id: string
  title: string
  description?: string
}
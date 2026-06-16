import type { ReactNode } from 'react'

type TabletHeroProps = {
  eyebrow: string
  title: string
  description: string
  meta?: ReactNode
  actions?: ReactNode
}

export function TabletHero({ eyebrow, title, description, meta, actions }: TabletHeroProps) {
  return (
    <section className="tablet-hero operational-card">
      <div className="tablet-hero__copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta ? <div className="tablet-hero__meta">{meta}</div> : null}
      {actions ? <div className="tablet-hero__actions">{actions}</div> : null}
    </section>
  )
}

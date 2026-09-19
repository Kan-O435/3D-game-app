import type { ReactNode } from 'react'

export interface ReceiptRow {
  label: string
  value: string
}

// A till-receipt style sheet used for the end-of-run certificates (death and
// clear). Purely presentational: a title, a few labelled rows, an optional
// round stamp, and whatever extra content goes underneath.
export function Receipt({
  title,
  subtitle,
  rows,
  stamp,
  children,
}: {
  title: string
  subtitle?: string
  rows: ReceiptRow[]
  stamp?: string
  children?: ReactNode
}) {
  return (
    <div className="receipt">
      {stamp && <div className="receipt-stamp">{stamp}</div>}
      <div className="receipt-brand">LUCKY CLOVER</div>
      <div className="receipt-title">{title}</div>
      {subtitle && <div className="receipt-sub">{subtitle}</div>}
      <div className="receipt-rule" />
      {rows.map((row) => (
        <div key={row.label} className="receipt-row">
          <span>{row.label}</span>
          <b>{row.value}</b>
        </div>
      ))}
      {children}
      <div className="barcode" />
    </div>
  )
}

// Rounded screen corners, edge darkening and faint scanlines laid over the whole
// game (clicks pass straight through). Pure CSS — see .crt in index.css.
export function CrtOverlay() {
  return (
    <div className="crt" aria-hidden>
      <div className="crt-lines" />
      <div className="crt-frame" />
    </div>
  )
}

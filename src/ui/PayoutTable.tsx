import { useMemo } from 'react'
import { payoutTable } from '../game'
import { useGameStore } from '../store/gameStore'
import { symbolColor } from '../scene/icons'

const LENGTHS = [2, 3, 4, 5]

// 配当表: what a run of N pays, per symbol group, plus the performance each
// symbol earns. Read straight from game/paylines.ts so it can't drift from the
// real payouts. Shown next to the machine while playing.
export function PayoutTable() {
  const isPlaying = useGameStore((s) => s.status === 'playing')
  const valueFactors = useGameStore((s) => s.valueFactors)
  const rows = useMemo(() => payoutTable(valueFactors), [valueFactors])

  if (!isPlaying) return null

  return (
    <div
      className="slot-panel"
      style={{ position: 'absolute', left: 16, bottom: 16, padding: '8px 12px', fontSize: 12, pointerEvents: 'none' }}
    >
      <div style={{ color: 'var(--gold)', letterSpacing: '0.3em', marginBottom: 4, fontWeight: 800, textShadow: '0 0 8px var(--gold)' }}>
        ◆ PAYOUT ◆
      </div>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#9a8466', borderBottom: '1px solid #3a2a1c' }}>
            <th style={{ textAlign: 'left', fontWeight: 400 }}>図柄</th>
            {LENGTHS.map((n) => (
              <th key={n} style={{ padding: '0 6px', fontWeight: 400 }}>
                {n}連
              </th>
            ))}
            <th style={{ padding: '0 6px', fontWeight: 400 }}>P</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.symbolIds.join('-')}
              style={{
                color: row.factor > 1 ? '#7fd18b' : row.factor < 1 ? '#e07a6b' : 'var(--led-amber)',
                textShadow: '0 0 6px currentColor',
              }}
            >
              <td style={{ paddingRight: 8 }}>
                {row.kind === 'normal' &&
                  row.symbolIds.map((id) => (
                    <span
                      key={id}
                      style={{ display: 'inline-block', width: 10, height: 10, marginRight: 2, background: symbolColor(id), border: '1px solid rgba(255,255,255,0.35)', borderRadius: 2 }}
                    />
                  ))}
                {row.kind === 'normal' && row.factor !== 1 && (
                  <b style={{ marginLeft: 4 }}>
                    {row.factor > 1 ? '▲' : '▼'}×{row.factor}
                  </b>
                )}
                {row.kind === 'wild' && <b style={{ color: '#f1c40f' }}>W ワイルド</b>}
                {row.kind === 'scatter' && <b style={{ color: '#c77dff' }}>★ ボーナス</b>}
                {row.kind === 'curse' && <b style={{ color: '#ff5a4a' }}>6 レートリミット</b>}
              </td>
              {row.kind === 'curse' ? (
                <td colSpan={LENGTHS.length + 1} style={{ padding: '0 6px', color: '#ff8a7a' }}>
                  3個以上で獲得を全没収
                </td>
              ) : (
                <>
                  {LENGTHS.map((n) => {
                    const i = row.lengths.indexOf(n)
                    return (
                      <td key={n} style={{ textAlign: 'right', padding: '0 6px' }}>
                        {i >= 0 ? row.payouts[i] : ''}
                      </td>
                    )
                  })}
                  <td style={{ textAlign: 'right', padding: '0 6px', color: '#7fd18b' }}>
                    {row.kind === 'scatter' ? '—' : `×${row.perf}`}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ color: '#8a7a62', marginTop: 4, fontSize: 11 }}>★は 3・4・5個の枚数、どこでも可</div>
    </div>
  )
}

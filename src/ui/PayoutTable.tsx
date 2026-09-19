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
      style={{
        position: 'absolute',
        left: 16,
        bottom: 16,
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.65)',
        border: '1px solid #555',
        borderRadius: 8,
        color: '#ccc',
        fontFamily: 'monospace',
        fontSize: 12,
        pointerEvents: 'none',
      }}
    >
      <div style={{ color: '#999', letterSpacing: 2, marginBottom: 4 }}>配当表</div>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#888' }}>
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
            <tr key={row.symbolIds.join('-')} style={row.factor !== 1 ? { color: row.factor > 1 ? '#7fd18b' : '#e07a6b' } : undefined}>
              <td style={{ paddingRight: 8 }}>
                {row.kind === 'normal' &&
                  row.symbolIds.map((id) => (
                    <span
                      key={id}
                      style={{ display: 'inline-block', width: 9, height: 9, marginRight: 2, background: symbolColor(id) }}
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
      <div style={{ color: '#777', marginTop: 4 }}>★は 3・4・5個の枚数、どこでも可</div>
    </div>
  )
}

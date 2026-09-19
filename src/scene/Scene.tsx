import { Room } from './Room'
import { Lighting } from './Lighting'
import { FixedCamera } from './FixedCamera'
import { Cabinet } from './Cabinet'

export function Scene() {
  return (
    <>
      <FixedCamera />
      <Lighting />
      <Room />
      <Cabinet />
    </>
  )
}

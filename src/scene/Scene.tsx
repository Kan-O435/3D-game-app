import { Room } from './Room'
import { Lighting } from './Lighting'
import { FixedCamera } from './FixedCamera'
import { Cabinet } from './Cabinet'
import { Props } from './Props'
import { PaySlip } from './PaySlip'
import { MoodDriver } from './MoodDriver'
import { Atmosphere } from './Atmosphere'

export function Scene() {
  return (
    <>
      <MoodDriver />
      <FixedCamera />
      <Lighting />
      <Room />
      <Cabinet />
      <Props />
      <PaySlip />
      <Atmosphere />
    </>
  )
}

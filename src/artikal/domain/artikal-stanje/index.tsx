import { Badge } from '@fluentui/react-components'
import { defineEnum } from '../../../common/domain'

// -------------------------------------------------------------------------------------
// Стање артикла
// -------------------------------------------------------------------------------------
//
// Исти распоред као у затеченим пројектима: `keys` носи ознаке, а из њега се изводи и
// шема и приказ и листа понуђених вредности. Нова вредност се додаје на једном месту.

export const keys = {
  U_PRIPREMI: 'У припреми',
  AKTIVAN: 'Активан',
  NEAKTIVAN: 'Неактиван',
} as const

export const ArtikalStanje = defineEnum(keys)

export type Value = (typeof ArtikalStanje.values)[number]

/** Шема за декодовање вредности са жице — уска унија, не `string`. */
export const Value = ArtikalStanje.Value

const boja = (stanje: Value) => (stanje === 'AKTIVAN' ? 'success' : stanje === 'NEAKTIVAN' ? 'danger' : 'informative')

export const StanjeBadge = ({ stanje, size = 'medium' }: { stanje: Value; size?: 'small' | 'medium' | 'large' }) => (
  <Badge appearance="tint" color={boja(stanje)} size={size}>
    {ArtikalStanje.labelOf(stanje)}
  </Badge>
)

export const stanjeColumnRender = (stanje: Value) => <StanjeBadge stanje={stanje} size="small" />

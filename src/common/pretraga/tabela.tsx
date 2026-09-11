import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  MessageBar,
  MessageBarBody,
  Skeleton,
  SkeletonItem,
  TableCellLayout,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import type { TableColumnDefinition, TableRowId } from '@fluentui/react-components'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { errorReport } from '../platform'
import type { Sort } from '../platform'
import { S, t } from '../strings'
import type { Model } from './model'
import { redovi, ucitava } from './model'

// -------------------------------------------------------------------------------------
// Табела листе
// -------------------------------------------------------------------------------------

export type Kolona<R, O extends string = string> = {
  /** Кључ колоне. Ако је међу сортабилнима, заглавље постаје кликтабилно. */
  readonly kljuc: O | string
  readonly naziv: string
  readonly sirina?: number
  readonly prikaz?: (red: R) => ReactNode
}

const useStyles = makeStyles({
  okvir: { position: 'relative', overflowX: 'auto' },
  poruka: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  skelet: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, padding: tokens.spacingVerticalM },
})

const Skelet = () => {
  const styles = useStyles()
  return (
    <div className={styles.skelet}>
      {[0, 1, 2, 3, 4].map(i => (
        <Skeleton key={i}>
          <SkeletonItem />
        </Skeleton>
      ))}
    </div>
  )
}

export type TabelaProps<R, O extends string> = {
  readonly model: Model<R, O>
  readonly kolone: ReadonlyArray<Kolona<R, O>>
  readonly sortabilne: ReadonlyArray<O>
  readonly kljuc: (red: R) => string | number
  readonly onSortiraj: (kolona: O) => void
  readonly onIzaberi: (red: R) => void
  readonly onOtvori: (red: R) => void
}

const kaoTekst = (v: unknown): string => (v == null ? '' : String(v))

export const Tabela = <R, O extends string>({
  model,
  kolone,
  sortabilne,
  kljuc,
  onSortiraj,
  onIzaberi,
  onOtvori,
}: TabelaProps<R, O>) => {
  const styles = useStyles()
  const stavke = useMemo(() => [...redovi(model.podaci)], [model.podaci])

  const definicije: TableColumnDefinition<R>[] = useMemo(
    () =>
      kolone.map(k => ({
        columnId: k.kljuc,
        // Сортира сервер; Fluent тражи функцију, али се она никад не позива.
        compare: () => 0,
        renderHeaderCell: () => <DataGridHeaderCell>{t(k.naziv)}</DataGridHeaderCell>,
        renderCell: (red: R) => (
          <DataGridCell>
            <TableCellLayout truncate>
              {k.prikaz ? k.prikaz(red) : kaoTekst((red as Record<string, unknown>)[k.kljuc])}
            </TableCellLayout>
          </DataGridCell>
        ),
      })),
    [kolone],
  )

  const sirine = useMemo(
    () =>
      kolone.reduce<Record<string, { defaultWidth: number; idealWidth: number }>>(
        (acc, k) => (k.sirina ? { ...acc, [k.kljuc]: { defaultWidth: k.sirina, idealWidth: k.sirina } } : acc),
        {},
      ),
    [kolone],
  )

  const prvi: Sort<O> | undefined = model.sort[0]
  const izabraniKljuc = model.izabrani === undefined ? undefined : kljuc(model.izabrani)

  if (model.podaci._tag === 'Greska') {
    return (
      <MessageBar intent="error">
        <MessageBarBody>{errorReport(model.podaci.error).message}</MessageBarBody>
      </MessageBar>
    )
  }

  return (
    <div className={styles.okvir}>
      <DataGrid
        size="small"
        items={stavke}
        columns={definicije}
        getRowId={(red: R) => kljuc(red)}
        selectionMode="single"
        selectedItems={izabraniKljuc === undefined ? new Set<TableRowId>() : new Set<TableRowId>([izabraniKljuc])}
        onSelectionChange={(_e, data) => {
          const izabran = stavke.find(red => data.selectedItems.has(kljuc(red)))
          if (izabran !== undefined) onIzaberi(izabran)
        }}
        sortable
        sortState={
          prvi === undefined
            ? { sortColumn: undefined, sortDirection: 'ascending' }
            : { sortColumn: prvi[0], sortDirection: prvi[1] === 'ASC' ? 'ascending' : 'descending' }
        }
        onSortChange={(_e, sledeci) => {
          const kolona = sledeci.sortColumn as O
          if (sortabilne.includes(kolona)) onSortiraj(kolona)
        }}
        resizableColumns
        columnSizingOptions={Object.keys(sirine).length > 0 ? sirine : undefined}
      >
        <DataGridHeader>
          <DataGridRow>{({ renderHeaderCell }) => renderHeaderCell()}</DataGridRow>
        </DataGridHeader>
        <DataGridBody<R>>
          {({ item, rowId }) => (
            <DataGridRow<R> key={rowId} onDoubleClick={() => onOtvori(item)}>
              {({ renderCell }) => renderCell(item)}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
      {ucitava(model.podaci) && stavke.length === 0 && <Skelet />}
      {model.podaci._tag === 'Ucitano' && stavke.length === 0 && (
        <div className={styles.poruka}>
          <Text>{t(S.lista.nemaRezultata)}</Text>
        </div>
      )}
    </div>
  )
}

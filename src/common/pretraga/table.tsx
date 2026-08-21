import {
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Spinner,
  TableCellLayout,
  Text,
  createTableColumn,
  makeStyles,
  mergeClasses,
  tokens,
  type DataGridProps,
  type SortDirection,
  type TableColumnDefinition,
  type TableRowId,
} from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import { memo, useMemo, type ReactNode } from 'react'
import { reportError } from '../error'
import { ErrorView } from '../error/view'
import { Data, isLoading, rows } from './data'
import type { Direction, Sort } from './sort'

export type Column<R, O extends string = string> = {
  readonly id: string
  readonly header: string
  readonly render: (row: R) => ReactNode
  readonly attribute?: O
  readonly width?: number
}

export type TableProps<R, O extends string = string> = {
  readonly columns: ReadonlyArray<Column<R, O>>
  readonly data: Data<R>
  readonly rowId: (row: R) => TableRowId
  readonly selected: ReadonlyArray<R>
  readonly onSelect: (rows: ReadonlyArray<R>) => void
  readonly selectionMode?: 'single' | 'multiselect'
  readonly onRetry: () => void
  readonly sort: Sort<O> | null
  readonly onSort?: ((sort: Sort<O>) => void) | undefined
}

const useStyles = makeStyles({
  frame: {
    position: 'relative',
    height: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  scroller: {
    height: '100%',
    overflowY: 'auto',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground4,
  },
  headerInner: {
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  busy: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    cursor: 'progress',
    pointerEvents: 'auto',
  },
  interactive: {
    pointerEvents: 'auto',
  },
})

const serverSorted = (_a: unknown, _b: unknown): number => 0

const toSortDirection = (direction: Direction): SortDirection => (direction === 'ASC' ? 'ascending' : 'descending')

const toDirection = (sortDirection: SortDirection): Direction => (sortDirection === 'ascending' ? 'ASC' : 'DESC')

const TableView = <R, O extends string = string>({
  columns,
  data,
  rowId,
  selected,
  onSelect,
  selectionMode = 'single',
  onRetry,
  sort,
  onSort,
}: TableProps<R, O>) => {
  const styles = useStyles()

  const items = rows(data)
  const loading = isLoading(data)

  const definitions: ReadonlyArray<TableColumnDefinition<R>> = useMemo(
    () =>
      columns.map(column =>
        createTableColumn<R>({
          columnId: column.id,
          ...(column.attribute === undefined ? {} : { compare: serverSorted }),
          renderHeaderCell: () => column.header,
          renderCell: row => <TableCellLayout truncate>{column.render(row)}</TableCellLayout>,
        }),
      ),
    [columns],
  )

  const sizes = useMemo(
    () =>
      Object.fromEntries(
        columns
          .filter(c => c.width !== undefined)
          .map(c => [c.id, { minWidth: c.width, defaultWidth: c.width, idealWidth: c.width }]),
      ),
    [columns],
  )

  const attributeOf = useMemo(() => new Map<string, O | undefined>(columns.map(c => [c.id, c.attribute])), [columns])

  const onSortChange: DataGridProps['onSortChange'] = (_event, nextSort) => {
    const attribute = attributeOf.get(String(nextSort.sortColumn))
    if (attribute === undefined || onSort === undefined) return
    onSort({ attribute, direction: toDirection(nextSort.sortDirection) })
  }

  const onSelectionChange: DataGridProps['onSelectionChange'] = (_event, selection) => {
    onSelect(items.filter(r => selection.selectedItems.has(rowId(r))))
  }

  const sortedColumn = columns.find(c => c.attribute === sort?.attribute)?.id

  return (
    <div className={styles.frame} aria-busy={loading}>
      <div className={styles.scroller}>
        <DataGrid
          size="small"
          items={[...items]}
          columns={[...definitions]}
          getRowId={item => rowId(item as R)}
          selectionMode={selectionMode}
          selectedItems={selected.map(rowId)}
          onSelectionChange={loading ? undefined : onSelectionChange}
          sortable={onSort !== undefined}
          sortState={{
            sortColumn: sortedColumn,
            sortDirection: sort === null ? 'ascending' : toSortDirection(sort.direction),
          }}
          onSortChange={loading ? undefined : onSortChange}
          resizableColumns
          resizableColumnsOptions={{ autoFitColumns: false }}
          columnSizingOptions={sizes}
        >
          <DataGridHeader className={styles.header}>
            <div className={styles.headerInner}>
              <DataGridRow>
                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
              </DataGridRow>
            </div>
          </DataGridHeader>
          <DataGridBody<R>>
            {({ item, rowId: id }) => (
              <DataGridRow<R> key={id}>
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </div>

      {Data.$match(data, {
        Loading: () => (
          <div className={mergeClasses(styles.layer, styles.busy)}>
            <Spinner size="small" labelPosition="below" label="Preuzimam podatke..." />
          </div>
        ),
        Ready: ({ page }) =>
          page.rows.length > 0 ? null : (
            <div className={styles.layer}>
              <Text>Nema rezultata za zadati kriterijum</Text>
            </div>
          ),
        Failed: ({ error }) => (
          <div className={styles.layer}>
            <div className={styles.interactive}>
              <ErrorView
                report={reportError(error)}
                actions={
                  <Button icon={<ArrowClockwiseRegular />} onClick={onRetry}>
                    Pokusaj ponovo
                  </Button>
                }
              />
            </div>
          </div>
        ),
      })}
    </div>
  )
}

export const Table = memo(TableView) as typeof TableView

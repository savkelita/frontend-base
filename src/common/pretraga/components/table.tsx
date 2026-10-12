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
import { reportError } from '../../error'
import { ErrorView } from '../../error/view'
import { Data, isLoading, rows } from '../data'
import { sortRows, type ColumnOrder, type Direction, type Sort } from '../sort'

export type Column<R, O extends string = string> = {
  readonly id: string
  readonly header: string
  readonly render: (row: R) => ReactNode
  readonly attribute?: O
  readonly order?: ColumnOrder<R>
  readonly width?: number
  readonly truncate?: boolean
}

export type TableProps<R, O extends string = string> = {
  readonly columns: ReadonlyArray<Column<R, O>>
  readonly data: Data<R>
  readonly rowId: (row: R) => TableRowId
  readonly selected?: ReadonlyArray<R>
  readonly onSelect?: (rows: ReadonlyArray<R>) => void
  readonly selectionMode?: 'single' | 'multiselect' | 'none'
  readonly emptyText?: string
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

const alreadySorted = (_a: unknown, _b: unknown): number => 0

const sortKeyOf = <R, O extends string>(column: Column<R, O>): O | undefined =>
  column.attribute ?? (column.order === undefined ? undefined : (column.id as O))

const toSortDirection = (direction: Direction): SortDirection => (direction === 'ASC' ? 'ascending' : 'descending')

const toDirection = (sortDirection: SortDirection): Direction => (sortDirection === 'ascending' ? 'ASC' : 'DESC')

const TableView = <R, O extends string = string>({
  columns,
  data,
  rowId,
  selected = [],
  onSelect,
  selectionMode = 'single',
  emptyText = 'Nema rezultata za zadati kriterijum',
  onRetry,
  sort,
  onSort,
}: TableProps<R, O>) => {
  const styles = useStyles()

  const items = useMemo(() => sortRows(rows(data), sort, columns), [data, sort, columns])
  const loading = isLoading(data)
  const selectable = selectionMode !== 'none' && onSelect !== undefined

  const definitions: ReadonlyArray<TableColumnDefinition<R>> = useMemo(
    () =>
      columns.map(column =>
        createTableColumn<R>({
          columnId: column.id,
          ...(sortKeyOf(column) === undefined ? {} : { compare: alreadySorted }),
          renderHeaderCell: () => column.header,
          renderCell: row => (
            <TableCellLayout truncate={column.truncate !== false}>{column.render(row)}</TableCellLayout>
          ),
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

  const keyOf = useMemo(() => new Map<string, O | undefined>(columns.map(c => [c.id, sortKeyOf(c)])), [columns])

  const onSortChange: DataGridProps['onSortChange'] = (_event, nextSort) => {
    const attribute = keyOf.get(String(nextSort.sortColumn))
    if (attribute === undefined || onSort === undefined) return
    onSort({ attribute, direction: toDirection(nextSort.sortDirection) })
  }

  const onSelectionChange: DataGridProps['onSelectionChange'] = (_event, selection) => {
    onSelect?.(items.filter(r => selection.selectedItems.has(rowId(r))))
  }

  const sortedColumn = columns.find(c => sortKeyOf(c) === sort?.attribute)?.id

  return (
    <div className={styles.frame} aria-busy={loading}>
      <div className={styles.scroller}>
        <DataGrid
          size="small"
          items={[...items]}
          columns={[...definitions]}
          getRowId={item => rowId(item as R)}
          {...(selectable ? { selectionMode: selectionMode as 'single' | 'multiselect' } : {})}
          selectedItems={selected.map(rowId)}
          onSelectionChange={loading || !selectable ? undefined : onSelectionChange}
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
              <Text>{emptyText}</Text>
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

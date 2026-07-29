import { Option } from 'effect'
import {
  Title1,
  Spinner,
  MessageBar,
  MessageBarBody,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
  Avatar,
  Button,
  tokens,
  makeStyles,
} from '@fluentui/react-components'
import { AddRegular, EditRegular, DeleteRegular } from '@fluentui/react-icons'
import * as Cmd from 'tea-effect/Cmd'
import * as Html from 'tea-effect/Html'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import type { Model } from './model'
import { Msg, productsLoaded, productsFailed, requestEdit, editMsg, requestDelete, deleteMsg } from './msg'
import * as Api from './api'
import * as Edit from './edit'
import * as Delete from './delete'

export type { Model }
export type { Msg }

// -------------------------------------------------------------------------------------
// Styles
// -------------------------------------------------------------------------------------

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontWeight: tokens.fontWeightSemibold,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
})

// -------------------------------------------------------------------------------------
// Commands
// -------------------------------------------------------------------------------------

const fetchProducts: Cmd.Cmd<Msg> = Http.send(Api.getProducts, {
  onSuccess: productsLoaded,
  onError: productsFailed,
})

// -------------------------------------------------------------------------------------
// Init
// -------------------------------------------------------------------------------------

export const init: [Model, Cmd.Cmd<Msg>] = [
  { products: [], isLoading: true, error: Option.none(), editing: Option.none(), deleting: Option.none() },
  fetchProducts,
]

// -------------------------------------------------------------------------------------
// Update
// -------------------------------------------------------------------------------------

export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] =>
  Msg.$match(msg, {
    LoadProducts: (): [Model, Cmd.Cmd<Msg>] => [{ ...model, isLoading: true, error: Option.none() }, fetchProducts],
    ProductsLoaded: ({ response }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, products: response.products, isLoading: false, error: Option.none() },
      Cmd.none,
    ],
    ProductsFailed: ({ error }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, isLoading: false, error: Option.some(error) },
      Cmd.none,
    ],

    RequestEdit: ({ id }): [Model, Cmd.Cmd<Msg>] => {
      const [editModel, cmd] = Edit.init(id)
      return [{ ...model, editing: Option.some({ model: editModel }) }, Cmd.map(editMsg)(cmd)]
    },

    // Host the edit dialog + fold its outcome (Saved -> close & refetch, Cancelled -> close).
    EditMsg: ({ msg: editMessage }): [Model, Cmd.Cmd<Msg>] => {
      if (Option.isNone(model.editing)) return [model, Cmd.none]
      const [editModel, cmd, outcome] = Edit.update(editMessage, model.editing.value.model)
      switch (outcome) {
        case 'Active':
          return [{ ...model, editing: Option.some({ model: editModel }) }, Cmd.map(editMsg)(cmd)]
        case 'Cancelled':
          return [{ ...model, editing: Option.none() }, Cmd.none]
        case 'Saved':
          return [{ ...model, editing: Option.none(), isLoading: true, error: Option.none() }, fetchProducts]
      }
    },

    RequestDelete: ({ id, title }): [Model, Cmd.Cmd<Msg>] => [
      { ...model, deleting: Option.some({ id, title, model: Delete.init }) },
      Cmd.none,
    ],

    // Host the delete dialog + fold its outcome (Deleted -> close & refetch, Cancelled -> close).
    DeleteMsg: ({ msg: deleteMessage }): [Model, Cmd.Cmd<Msg>] => {
      if (Option.isNone(model.deleting)) return [model, Cmd.none]
      const current = model.deleting.value
      const [deleteModel, cmd, outcome] = Delete.update(current.id, deleteMessage, current.model)
      switch (outcome) {
        case 'Active':
          return [{ ...model, deleting: Option.some({ ...current, model: deleteModel }) }, Cmd.map(deleteMsg)(cmd)]
        case 'Cancelled':
          return [{ ...model, deleting: Option.none() }, Cmd.none]
        case 'Deleted':
          return [{ ...model, deleting: Option.none(), isLoading: true, error: Option.none() }, fetchProducts]
      }
    },
  })

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

const columns = ['Product', 'Category', 'Price', 'Rating', 'Stock', ''] as const

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (dispatch: Platform.Dispatch<Msg>) => <ProductsView model={model} dispatch={dispatch} />

const ProductsView = ({ model, dispatch }: { readonly model: Model; readonly dispatch: Platform.Dispatch<Msg> }) => {
  const styles = useStyles()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title1>Products</Title1>
        <Button as="a" href="/products/new" appearance="primary" icon={<AddRegular />}>
          New product
        </Button>
      </div>
      {model.isLoading ? (
        <Spinner label="Loading products..." />
      ) : Option.isSome(model.error) ? (
        <MessageBar intent="error">
          <MessageBarBody>Failed to load products.</MessageBarBody>
        </MessageBar>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHeaderCell key={col || i}>{col}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {model.products.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <TableCellLayout media={<Avatar image={{ src: product.thumbnail }} shape="square" />}>
                    {product.title}
                  </TableCellLayout>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  <span className={styles.price}>${product.price.toFixed(2)}</span>
                </TableCell>
                <TableCell>{product.rating.toFixed(1)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <div className={styles.actions}>
                    <Button
                      appearance="subtle"
                      icon={<EditRegular />}
                      onClick={() => dispatch(requestEdit(product.id))}
                    >
                      Izmeni
                    </Button>
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      onClick={() => dispatch(requestDelete(product.id, product.title))}
                    >
                      Obriši
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {Option.isSome(model.editing) && Html.map(editMsg)(Edit.view(model.editing.value.model))(dispatch)}
      {Option.isSome(model.deleting) &&
        Html.map(deleteMsg)(Delete.view(model.deleting.value.model, model.deleting.value.title))(dispatch)}
    </div>
  )
}

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
  tokens,
  makeStyles,
} from '@fluentui/react-components'
import * as Cmd from 'tea-effect/Cmd'
import * as Http from 'tea-effect/Http'
import type * as Platform from 'tea-effect/Platform'
import type * as TeaReact from 'tea-effect/React'
import type { Model } from './model'
import { Msg, productsLoaded, productsFailed } from './msg'
import * as Api from './api'

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
  price: {
    fontWeight: tokens.fontWeightSemibold,
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

export const init: [Model, Cmd.Cmd<Msg>] = [{ products: [], isLoading: true, error: Option.none() }, fetchProducts]

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
  })

// -------------------------------------------------------------------------------------
// View
// -------------------------------------------------------------------------------------

const columns = ['Product', 'Category', 'Price', 'Rating', 'Stock'] as const

export const view =
  (model: Model): TeaReact.Html<Msg> =>
  (_dispatch: Platform.Dispatch<Msg>) => <ProductsView model={model} />

const ProductsView = ({ model }: { readonly model: Model }) => {
  const styles = useStyles()

  return (
    <div className={styles.container}>
      <Title1>Products</Title1>
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
              {columns.map(col => (
                <TableHeaderCell key={col}>{col}</TableHeaderCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

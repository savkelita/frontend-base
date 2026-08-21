import { Combobox, Field, Tag, TagGroup, makeStyles, tokens } from '@fluentui/react-components'
import type { Locals } from 'effect-form/Locals'
import type { ReactNode } from 'react'
import { rows } from '../../../pretraga'
import type { Model } from '../../combo/model'
import { closed, opened, selected, typed, type Msg } from '../../combo/msg'
import { ComboListbox, type Render } from './combo-field'

export type MultiComboFieldOptions<A> = {
  readonly model: Model<A>
  readonly onMsg: (msg: Msg<A>) => void
  readonly placeholder?: string
}

const useStyles = makeStyles({
  control: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
})

const MultiComboView = <A,>({
  l,
  id,
  render,
}: { l: Locals<ReadonlyArray<A>, MultiComboFieldOptions<A>> } & Render<A>): ReactNode => {
  const styles = useStyles()
  const { model, onMsg } = l
  const items = model.data === null ? [] : rows(model.data)

  const chosen = (key: string): A | undefined =>
    l.value.find(one => String(id(one)) === key) ?? items.find(one => String(id(one)) === key)

  return (
    <Field
      {...(l.label === undefined ? {} : { label: l.label })}
      required={l.required}
      validationState={l.hasError ? 'error' : 'none'}
      {...(l.error === undefined ? {} : { validationMessage: l.error })}
    >
      <div className={styles.control}>
        <Combobox
          multiselect
          id={l.id}
          name={l.name}
          disabled={l.disabled}
          {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
          value={model.input}
          selectedOptions={l.value.map(one => String(id(one)))}
          open={model.open}
          autoComplete="off"
          onOpenChange={(_event, data) => onMsg(data.open ? opened<A>() : closed<A>())}
          onChange={event => onMsg(typed<A>(event.target.value))}
          onOptionSelect={(_event, data) =>
            onMsg(selected<A>(data.selectedOptions.map(chosen).filter((one): one is A => one !== undefined)))
          }
        >
          <ComboListbox model={model} onMsg={onMsg} id={id} render={render} />
        </Combobox>

        {l.value.length > 0 && (
          <TagGroup
            size="small"
            onDismiss={(_event, data) => onMsg(selected<A>(l.value.filter(one => String(id(one)) !== data.value)))}
          >
            {l.value.map(one => (
              <Tag key={id(one)} value={String(id(one))} dismissible disabled={l.disabled}>
                {render(one)}
              </Tag>
            ))}
          </TagGroup>
        )}
      </div>
    </Field>
  )
}

export const multiComboField =
  <A,>({ id, render }: Render<A>) =>
  (l: Locals<ReadonlyArray<A>, MultiComboFieldOptions<A>>): ReactNode => (
    <MultiComboView l={l} id={id} render={render} />
  )

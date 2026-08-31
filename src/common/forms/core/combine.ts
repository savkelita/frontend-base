import type * as Cmd from 'tea-effect/Cmd'
import type { FieldDef } from './field'
import type { Fields, FieldRule, FormSpec, Config } from './object'
import { object } from './object'
import type { Issue, Mode } from './types'

// -------------------------------------------------------------------------------------
// Form.combine — compose sections into one form over dotted-path keys
// -------------------------------------------------------------------------------------
//
// Sections are plain field-group maps. combine flattens them into a single dotted-key
// field map (`general.warehouse`, `lot.lot`) and reuses Form.object. Each field's local
// `dependsOn` is resolved to a source path: a same-section sibling by default, or a
// cross-section path via `rebind`. The field is wrapped so its search still reads deps by
// their LOCAL names while the graph/reset/deps-injection operate on full paths.

export type Rebind = {
  readonly field: string // dotted path of the dependent field, e.g. 'lot.lot'
  readonly dep: string // local dependency name it declares, e.g. 'warehouse'
  readonly to: string // source path to bind it to, e.g. 'general.warehouse'
}

export type CombineConfig = {
  readonly rebind?: ReadonlyArray<Rebind>
  readonly effects?: ReadonlyArray<{ readonly when: string; readonly run: (draft: any) => Cmd.Cmd<any> }>
  readonly rules?: (draft: any, ctx: { readonly mode: Mode }) => Record<string, Partial<FieldRule>>
  readonly validate?: (draft: any) => ReadonlyArray<Issue>
}

const pathExists = (sections: Record<string, Fields>, path: string): boolean => {
  const [section, key] = path.split('.')
  return Boolean(sections[section] && key in sections[section])
}

// Wrap a field so its `dependsOn` become source paths, and ctx.deps (keyed by those paths)
// are re-keyed to the local names the field's search expects.
const wrapField = (
  field: FieldDef<any, any, any, any>,
  mapping: Record<string, string>,
): FieldDef<any, any, any, any> => ({
  ...field,
  dependsOn: Object.values(mapping),
  update: (msg, state, ctx) => {
    const localDeps: Record<string, unknown> = {}
    for (const [local, source] of Object.entries(mapping)) localDeps[local] = ctx.deps[source]
    return field.update(msg, state, { deps: localDeps, mode: ctx.mode })
  },
})

export const combine = (sections: Record<string, Fields>, config: CombineConfig = {}): FormSpec<Fields> => {
  const rebind = config.rebind ?? []
  const flat: Record<string, FieldDef<any, any, any, any>> = {}

  for (const [section, fields] of Object.entries(sections)) {
    for (const [key, field] of Object.entries(fields)) {
      const path = `${section}.${key}`
      const mapping: Record<string, string> = {}
      for (const dep of field.dependsOn ?? []) {
        const bound = rebind.find(r => r.field === path && r.dep === dep)
        const source = bound ? bound.to : `${section}.${dep}`
        if (!pathExists(sections, source)) {
          throw new Error(`Form.combine: '${path}' depends on '${dep}' -> '${source}', which does not exist`)
        }
        mapping[dep] = source
      }
      flat[path] = wrapField(field, mapping)
    }
  }

  return object(flat, {
    effects: config.effects,
    rules: config.rules,
    validate: config.validate,
  } as Config<Fields>)
}

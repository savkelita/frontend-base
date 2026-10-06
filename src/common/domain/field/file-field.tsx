import {
  Body1,
  Button,
  Caption1,
  Card,
  MessageBar,
  MessageBarBody,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components'
import { ArrowSyncRegular, DeleteRegular, DocumentArrowUpRegular, DocumentRegular } from '@fluentui/react-icons'
import type { Locals } from 'effect-form/Locals'
import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { FormField } from './form-field'

export type Fajl = {
  readonly naziv: string
  readonly sadrzaj: string
}

export type FileForm = Fajl | null

export interface FileFieldOptions {
  readonly accept?: string
  readonly maxBytes?: number
  readonly placeholder?: string
}

export const MAX_BYTES = 5 * 1024 * 1024

export const extension = (naziv: string): string => naziv.slice(naziv.lastIndexOf('.') + 1).toLowerCase()

export const isAccepted = (accept: string | undefined, naziv: string): boolean => {
  if (accept === undefined) return true
  const extensions = accept
    .split(',')
    .map(part => part.trim().toLowerCase())
    .filter(part => part.startsWith('.'))
  return extensions.length === 0 || extensions.includes(`.${extension(naziv)}`)
}

export const formatSize = (bytes: number): string =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

export const base64Bytes = (sadrzaj: string): number => {
  const padding = sadrzaj.endsWith('==') ? 2 : sadrzaj.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((sadrzaj.length * 3) / 4) - padding)
}

const readBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') return reject(new Error('procitan sadrzaj nije tekst'))
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error ?? new Error('citanje nije uspelo'))
    reader.readAsDataURL(file)
  })

const useStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    alignItems: 'stretch',
  },
  box: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: tokens.spacingVerticalXS,
    minHeight: '150px',
    padding: tokens.spacingVerticalL,
    border: `1px dashed ${tokens.colorNeutralStroke1}`,
    textAlign: 'center',
  },
  dragging: {
    border: `1px dashed ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  icon: {
    fontSize: '32px',
    color: tokens.colorNeutralForeground3,
  },
  fileName: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
})

const EmptyContent = ({
  maxBytes,
  placeholder,
}: {
  readonly maxBytes: number
  readonly placeholder: string | undefined
}): ReactNode => {
  const styles = useStyles()
  return (
    <>
      <DocumentArrowUpRegular className={styles.icon} />
      <Body1>{placeholder ?? 'Prevucite fajl ovde ili kliknite da ga izaberete'}</Body1>
      <Caption1>{`Najvise ${formatSize(maxBytes)}`}</Caption1>
    </>
  )
}

const SelectedContent = ({
  fajl,
  disabled,
  onReplace,
  onRemove,
}: {
  readonly fajl: Fajl
  readonly disabled: boolean
  readonly onReplace: () => void
  readonly onRemove: () => void
}): ReactNode => {
  const styles = useStyles()
  return (
    <>
      <DocumentRegular className={styles.icon} />
      <Body1 className={styles.fileName}>{fajl.naziv}</Body1>
      <Caption1>{formatSize(base64Bytes(fajl.sadrzaj))}</Caption1>
      <div className={styles.actions}>
        <Button size="small" icon={<ArrowSyncRegular />} disabled={disabled} onClick={onReplace}>
          Zameni
        </Button>
        <Button size="small" appearance="subtle" icon={<DeleteRegular />} disabled={disabled} onClick={onRemove}>
          Ukloni
        </Button>
      </div>
    </>
  )
}

type ViewProps = Pick<Locals<FileForm, FileFieldOptions>, 'id' | 'name' | 'value' | 'disabled' | 'onChange'> &
  FileFieldOptions

const FileView = ({
  id,
  name,
  value,
  disabled,
  onChange,
  accept,
  maxBytes = MAX_BYTES,
  placeholder,
}: ViewProps): ReactNode => {
  const styles = useStyles()
  const input = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rejection, setRejection] = useState<string | undefined>(undefined)

  const open = () => {
    if (!disabled) input.current?.click()
  }

  const pick = (file: File) => {
    if (!isAccepted(accept, file.name)) return setRejection(`Dozvoljeni formati: ${accept}`)
    if (file.size > maxBytes) return setRejection(`Najveca dozvoljena velicina je ${formatSize(maxBytes)}`)
    setRejection(undefined)
    readBase64(file).then(
      sadrzaj => onChange({ naziv: file.name, sadrzaj }),
      () => setRejection('Fajl nije moguce procitati'),
    )
  }

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (!disabled && file !== undefined) pick(file)
  }

  const remove = () => {
    setRejection(undefined)
    onChange(null)
  }

  return (
    <div className={styles.stack}>
      <Card
        className={mergeClasses(styles.box, isDragging && styles.dragging)}
        aria-controls={id}
        onDragOver={event => event.preventDefault()}
        onDragEnter={() => !disabled && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={drop}
        {...(value === null
          ? { role: 'button', 'aria-label': placeholder ?? 'Izaberite fajl', 'aria-disabled': disabled, onClick: open }
          : {})}
      >
        {value === null ? (
          <EmptyContent maxBytes={maxBytes} placeholder={placeholder} />
        ) : (
          <SelectedContent fajl={value} disabled={disabled} onReplace={open} onRemove={remove} />
        )}
      </Card>

      <input
        ref={input}
        id={id}
        name={name}
        type="file"
        tabIndex={-1}
        className={styles.visuallyHidden}
        disabled={disabled}
        {...(accept === undefined ? {} : { accept })}
        onChange={event => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file !== undefined) pick(file)
        }}
      />

      {rejection !== undefined && (
        <MessageBar intent="error">
          <MessageBarBody>{rejection}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  )
}

export const fileField = (l: Locals<FileForm, FileFieldOptions>): ReactNode => (
  <FormField l={l}>
    <FileView
      id={l.id}
      name={l.name}
      value={l.value}
      disabled={l.disabled}
      onChange={l.onChange}
      {...(l.accept === undefined ? {} : { accept: l.accept })}
      {...(l.maxBytes === undefined ? {} : { maxBytes: l.maxBytes })}
      {...(l.placeholder === undefined ? {} : { placeholder: l.placeholder })}
    />
  </FormField>
)

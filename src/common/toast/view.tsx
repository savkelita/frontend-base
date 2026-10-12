import {
  Link,
  Toast as FluentToast,
  ToastBody,
  ToastTitle,
  Toaster,
  useToastController,
} from '@fluentui/react-components'
import { useEffect } from 'react'
import { register } from './toast'

const TOASTER_ID = 'app'

const TIMEOUT = 3000

const TIMEOUT_SA_AKCIJOM = 8000

export const ToastHost = (): JSX.Element => {
  const { dispatchToast } = useToastController(TOASTER_ID)

  useEffect(
    () =>
      register(toast =>
        dispatchToast(
          <FluentToast>
            <ToastTitle
              action={toast.action === null ? undefined : <Link onClick={toast.action.run}>{toast.action.label}</Link>}
            >
              {toast.title}
            </ToastTitle>
            {toast.body !== null && <ToastBody>{toast.body}</ToastBody>}
          </FluentToast>,
          {
            intent: toast.intent,
            timeout: toast.action === null ? TIMEOUT : TIMEOUT_SA_AKCIJOM,
            onStatusChange: (_, data) => {
              if (data.status === 'unmounted') toast.close()
            },
          },
        ),
      ),
    [dispatchToast],
  )

  return <Toaster toasterId={TOASTER_ID} position="bottom-end" pauseOnHover />
}

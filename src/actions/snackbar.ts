import * as A from '../types/ActionType'

export const enqueueSnackbar = (snackbar: SnackbarData): SnackbarAction => ({
  type: A.ENQUEUE_SNACKBAR,
  snackbar,
})

export const simpleMessageSnackbar = (
  message: string,
  autoHideDuration?: number | null
): SnackbarAction =>
  enqueueSnackbar({
    type: 'SimpleMessage',
    props: { message, autoHideDuration },
  })

export const promptSnackbar = (
  message: string,
  actions: [string, Action][],
  autoHideDuration?: number | null
): SnackbarAction =>
  enqueueSnackbar({
    type: 'Prompt',
    props: { message, autoHideDuration, actions },
  })

export const closeSnackbar = (): SnackbarAction => ({
  type: A.CLOSE_SNACKBAR,
})

import A from '../types/ActionType'

export const dialogActions = {
  [A.enqueueDialog]: (dialog: DialogData, skipQueue: boolean = false) => ({
    type: A.enqueueDialog,
    dialog,
    skipQueue,
  }),

  [A.closeDialog]: () => ({
    type: A.closeDialog,
  }),
}

const confirmationDialog = (
  message: string,
  action: Action,
  onCancel: Action | null = null,
  skipQueue: boolean = false
) =>
  dialogActions.enqueueDialog(
    {
      type: 'Confirmation',
      message,
      action,
      onCancel,
    },
    skipQueue
  )
const errorDialog = (message: string, log: string) =>
  dialogActions.enqueueDialog(
    {
      type: 'Error',
      message,
      log,
    },
    true
  )

const mediaFolderLocationFormDialog = (
  action: Action | null,
  skipQueue: boolean
) =>
  dialogActions.enqueueDialog(
    {
      type: 'MediaFolderLocationForm',
      action,
    },
    skipQueue
  )

const reviewAndExportDialog = (
  mediaOpenPrior: MediaFile | null,
  mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds']
) =>
  dialogActions.enqueueDialog({
    type: 'ReviewAndExport',
    mediaOpenPrior,
    mediaFileIdsToClipIds: mediaFileIdsToClipIds,
  })

const newProjectFormDialog = () =>
  dialogActions.enqueueDialog({ type: 'NewProjectForm' })

const fileSelectionDialog = (message: string, file: FileMetadata) =>
  dialogActions.enqueueDialog({ type: 'FileSelection', message, file })

const csvAndMp3ExportDialog = (
  mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds']
) =>
  dialogActions.enqueueDialog(
    { type: 'CsvAndMp3Export', mediaFileIdsToClipIds },
    true
  )

const subtitlesClipDialog = () =>
  dialogActions.enqueueDialog({ type: 'SubtitlesClips' })

const settingsDialog = () =>
  dialogActions.enqueueDialog({ type: 'Settings' }, true)

const linkSubtitlesDialog = (
  subtitles: ExternalSubtitlesFile | VttFromEmbeddedSubtitles,
  mediaFileId: MediaFileId
) =>
  dialogActions.enqueueDialog({
    type: 'LinkSubtitles',
    subtitles,
    mediaFileId,
  })

const dictionariesDialog = () =>
  dialogActions.enqueueDialog(
    {
      type: 'Dictionaries',
    },
    true
  )

export const compositeDialogActions = {
  confirmationDialog,
  errorDialog,
  mediaFolderLocationFormDialog,
  reviewAndExportDialog,
  newProjectFormDialog,
  fileSelectionDialog,
  csvAndMp3ExportDialog,
  subtitlesClipDialog,
  settingsDialog,
  linkSubtitlesDialog,
  dictionariesDialog,
}

import * as r from '../redux'

import { FileEventHandlers } from './eventHandlers'

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [await r.openFileSuccess(file, filePath)]
  },
  openSuccess: [],
  locateRequest: async ({ file }, state, effects) => {
    try {
      const parentFile = r.getFileAvailabilityById(state, 'MediaFile', file.id)
      if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
        return [
          r.openFileFailure(file, null, 'You must first locate this file.'),
        ]

      const cbr = r.getConstantBitrateFilePath(state, parentFile.id)

      return cbr
        ? [
            r.locateFileSuccess(
              file,
              await effects.getWaveformPng(state, file, cbr)
            ),
          ]
        : []
    } catch (err) {
      return [
        r.openFileFailure(
          file,
          null,
          'Problem making waveform image: ' + (err.message || err.toString())
        ),
      ]
    }
  },
  locateSuccess: null,
  deleteRequest: [
    async (file, descendants, state, effects) => [
      r.deleteFileSuccess(file, descendants),
    ],
  ],
  deleteSuccess: [],
} as FileEventHandlers<WaveformPng>
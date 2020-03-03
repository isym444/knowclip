import moment from 'moment'
import { createSelector } from 'reselect'
import { getProjectMediaFiles } from './currentMedia'
import { getSubtitlesSourceFile } from './subtitles'
import { getClipIdsByMediaFileId, getClip, getFlashcard } from './clips'
import { nowUtcTimestamp } from '../utils/sideEffects'
import { getSecondsAtX } from './waveformTime'
import { formatDurationWithMilliseconds } from '../utils/formatTime'
import {
  blankSimpleFields,
  blankTransliterationFields,
} from '../utils/newFlashcard'
import YAML from 'yaml'
import {
  MediaJson,
  SubtitlesJson,
  ClipJson,
  ProjectJson,
} from '../types/Project'

const newestToOldest = (
  { lastOpened: a }: FileAvailability,
  { lastOpened: b }: FileAvailability
): number => {
  if (!a) return 1
  if (!b) return -1
  return moment(b).valueOf() - moment(a).valueOf()
}
export const getProjects = createSelector(
  (state: AppState) => state.fileAvailabilities.ProjectFile,
  (availabilities): Array<FileAvailability> =>
    Object.entries(availabilities)
      .map(
        ([id, availability]): FileAvailability =>
          availability || {
            id,
            name: 'Unknown project file',
            parentId: null,
            type: 'ProjectFile',
            filePath: null,
            status: 'NOT_FOUND',
            isLoading: false,
            lastOpened: null,
          }
      )
      .sort(newestToOldest)
)

export const getProjectIdByFilePath = (
  state: AppState,
  filePath: string
): ProjectId | null =>
  Object.keys(state.fileAvailabilities.ProjectFile).find(
    id =>
      (state.fileAvailabilities.ProjectFile[id] as KnownFile).filePath ===
      filePath
  ) || null

export const getProjectJson = <F extends FlashcardFields>(
  state: AppState,
  file: ProjectFile,
  fieldsTemplate: F
): ProjectJson<F> => {
  const mediaFiles = getProjectMediaFiles(state, file.id)
  return {
    project: {
      name: file.name,
      noteType: file.noteType,
      timestamp: nowUtcTimestamp(),
      id: file.id,
    },

    media: mediaFiles.map(
      (mediaFile): MediaJson<F> => {
        const { name, format, durationSeconds, id } = mediaFile

        const subtitles: SubtitlesJson[] = mediaFile.subtitles.map(s =>
          s.type === 'EmbeddedSubtitlesTrack'
            ? {
                id: s.id,
                streamIndex: s.streamIndex,
                type: 'Embedded',
              }
            : {
                id: s.id,
                type: 'External',
                name: (
                  (getSubtitlesSourceFile(
                    state,
                    s.id
                  ) as ExternalSubtitlesFile | null) || {
                    name: 'External subtitles file',
                  }
                ).name,
              }
        )

        const clips = getProjectClips(state, mediaFile, fieldsTemplate)

        const newMediaFile: MediaJson<F> = {
          name,
          format,
          duration: formatDurationWithMilliseconds(
            moment.duration({
              seconds: durationSeconds,
            })
          ),
          id,
        }

        if (subtitles.length) newMediaFile.subtitles = subtitles
        if (clips.length) newMediaFile.clips = clips
        if (Object.keys(mediaFile.flashcardFieldsToSubtitlesTracks).length)
          newMediaFile.flashcardFieldsToSubtitlesTracks =
            mediaFile.flashcardFieldsToSubtitlesTracks

        return newMediaFile
      }
    ),
  }
}
function getProjectClips<F extends FlashcardFields>(
  state: AppState,
  mediaFile: MediaFile,
  fieldsTemplate: F
) {
  const clips = [] as ClipJson<F>[]
  for (const id of getClipIdsByMediaFileId(state, mediaFile.id)) {
    const clip = getClip(state, id)
    const card = getFlashcard(state, id)
    if (clip && card) {
      const { start, end } = clip
      const { fields, tags, image, cloze } = card

      const newClip: ClipJson<F> = {
        id,
        start: formatDurationWithMilliseconds(
          moment.duration({
            seconds: getSecondsAtX(state, start),
          })
        ),
        end: formatDurationWithMilliseconds(
          moment.duration({
            seconds: getSecondsAtX(state, end),
          })
        ),
      }

      const newFields = {}
      Object.keys(fieldsTemplate).reduce(
        (all, fn) => {
          const fieldName: keyof typeof fields = fn as any
          if (fields[fieldName].trim()) {
            all[fieldName] =
              fieldName === 'transcription' && cloze.length
                ? encodeClozeDeletions(fields[fieldName], cloze)
                : fields[fieldName]
          }

          return all
        },
        newFields as F
      )
      if (Object.keys(newFields).length) newClip.fields = newFields

      if (tags.length) newClip.tags = tags

      if (image)
        newClip.image = {
          type: 'VideoStill',
          ...(typeof image.seconds === 'number'
            ? { seconds: image.seconds }
            : null),
        }

      clips.push(newClip)
    }
  }

  return clips
}

const escapeClozeChars = (text: string) =>
  text.replace(/(<\/?c(10|[1-9])>)/g, `\\$1`)
const encodeClozeDeletions = (text: string, cloze: ClozeDeletion[]) => {
  const ranges = cloze
    .flatMap((c, clozeIndex) => c.ranges.map(range => ({ range, clozeIndex })))
    .sort((a, b) => a.range.start - b.range.start)
  if (!ranges.length) return escapeClozeChars(text)
  const firstRange = ranges[0].range
  let result = firstRange.start > 0 ? text.slice(0, firstRange.start) : ''
  let i = 0
  for (const { range, clozeIndex } of ranges) {
    const nextRange = ranges[i + 1]
    const subsequentGapEnd = nextRange ? nextRange.range.start : text.length

    result +=
      `{{c${clozeIndex + 1}::${escapeClozeChars(
        text.slice(range.start, range.end)
      )}}}` + escapeClozeChars(text.slice(range.end, subsequentGapEnd))

    i++
  }
  return result
}

const getFieldsTemplate = (file: ProjectFile) =>
  file.noteType === 'Simple' ? blankSimpleFields : blankTransliterationFields

export const getProjectFileContents = (
  state: AppState,
  projectFile: ProjectFile
): string => {
  const { project, media } = getProjectJson(
    state,
    projectFile,
    getFieldsTemplate(projectFile)
  )
  return (
    `# This file was created by Knowclip!\n# Edit it manually at your own risk.\n` +
    [project, ...media].map(o => YAML.stringify(o)).join('---\n')
  )
}

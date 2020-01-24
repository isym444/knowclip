import stripHtml from '../utils/stripHtml'
import { getXAtMilliseconds } from './waveformTime'
import {
  blankSimpleFields,
  blankTransliterationFields,
} from '../utils/newFlashcard'
import { getFileAvailability } from './files'
import { createSelector } from 'reselect'
import { getCurrentMediaFile } from './currentMedia'

export const getSubtitlesDisplayFile = (
  state: AppState,
  id: string
): VttConvertedSubtitlesFile | ExternalSubtitlesFile | null =>
  state.files.VttConvertedSubtitlesFile[id] ||
  state.files.ExternalSubtitlesFile[id] ||
  null

const getSubtitlesSourceFileFromFilesSubset = (
  external: FilesState['ExternalSubtitlesFile'],
  generated: FilesState['VttConvertedSubtitlesFile'],
  id: string
) => external[id] || generated[id] || null
export const getSubtitlesSourceFile = (
  state: AppState,
  id: string
): ExternalSubtitlesFile | VttConvertedSubtitlesFile | null =>
  getSubtitlesSourceFileFromFilesSubset(
    state.files.ExternalSubtitlesFile,
    state.files.VttConvertedSubtitlesFile,
    id
  )

export const getSubtitlesFileAvailability = (state: AppState, id: string) => {
  const record = getSubtitlesDisplayFile(state, id)

  return record ? getFileAvailability(state, record) : null
}

const getSubtitles = (state: AppState) => state.subtitles

export const getSubtitlesTracks = createSelector(
  getCurrentMediaFile,
  getSubtitles,
  (currentFile, subtitles): Array<SubtitlesTrack> => {
    if (!currentFile) return []
    return currentFile.subtitles
      .map(({ id }) => subtitles[id])
      .filter((track): track is SubtitlesTrack => Boolean(track))
  }
)
export const getSubtitlesFilesWithTracks = createSelector(
  getCurrentMediaFile,
  getSubtitles,
  (state: AppState) => state.files.ExternalSubtitlesFile,
  (state: AppState) => state.files.VttConvertedSubtitlesFile,
  (
    currentFile,
    subtitlesTracks,
    externalFiles,
    convertedFiles
  ): Array<{
    relation: MediaSubtitlesRelation
    file: SubtitlesFile | null // can be null while loading?
    track: SubtitlesTrack | null
  }> =>
    currentFile
      ? currentFile.subtitles.map(t => {
          return {
            relation: t,
            file: getSubtitlesSourceFileFromFilesSubset(
              externalFiles,
              convertedFiles,
              t.id
            ),
            track: subtitlesTracks[t.id] || null,
          }
        })
      : []
)

export const getSubtitlesTrack = (
  state: AppState,
  id: SubtitlesTrackId
): SubtitlesTrack | null => state.subtitles[id] || null

const isEmbedded = (track: SubtitlesTrack): track is EmbeddedSubtitlesTrack =>
  track.type === 'EmbeddedSubtitlesTrack'
const isExternal = (track: SubtitlesTrack): track is ExternalSubtitlesTrack =>
  track.type === 'ExternalSubtitlesTrack'
export const getEmbeddedSubtitlesTracks = (
  state: AppState
): Array<EmbeddedSubtitlesTrack> => getSubtitlesTracks(state).filter(isEmbedded)
export const getExternalSubtitlesTracks = (
  state: AppState
): Array<ExternalSubtitlesTrack> => getSubtitlesTracks(state).filter(isExternal)

export const readVttChunk = (
  state: AppState,
  {
    start,
    end,
    text,
  }: {
    start: number
    end: number
    text: string
  }
): SubtitlesChunk => ({
  start: getXAtMilliseconds(state, start),
  end: getXAtMilliseconds(state, end),
  text: (stripHtml(text) || '').trim(),
})

export const readSubsrtChunk = readVttChunk

const overlap = (
  chunk: SubtitlesChunk,
  start: WaveformX,
  end: WaveformX,
  halfSecond: WaveformX
): boolean =>
  (start >= chunk.start && chunk.end - start >= halfSecond) ||
  (end <= chunk.end && end - chunk.start >= halfSecond) ||
  (chunk.start >= start && chunk.end <= end)

export const getSubtitlesChunksWithinRange = (
  state: AppState,
  subtitlesTrackId: SubtitlesTrackId,
  start: WaveformX,
  end: WaveformX
): Array<SubtitlesChunk> => {
  const track = getSubtitlesTrack(state, subtitlesTrackId)
  if (!track) return []

  return track.chunks.filter(chunk =>
    overlap(
      chunk,
      start,
      end,
      (state.waveform.stepsPerSecond * state.waveform.stepLength) / 2
    )
  )
}

export const getSubtitlesFlashcardFieldLinks = (
  state: AppState // should probably be ?id
): SubtitlesFlashcardFieldsLinks => {
  const media = getCurrentMediaFile(state)
  return media ? media.flashcardFieldsToSubtitlesTracks : {}
}

export const getNewFieldsFromLinkedSubtitles = (
  state: AppState,
  noteType: NoteType,
  { start, end }: PendingClip
): FlashcardFields => {
  const links = getSubtitlesFlashcardFieldLinks(state)
  const result =
    noteType === 'Simple'
      ? { ...blankSimpleFields }
      : { ...blankTransliterationFields }
  for (const fieldName in links) {
    const coerced = fieldName as FlashcardFieldName
    const trackId = links[coerced]
    const chunks = trackId
      ? getSubtitlesChunksWithinRange(state, trackId, start, end)
      : []
    // @ts-ignore
    result[fieldName] = chunks.map(chunk => chunk.text).join('\n')
  }
  return result
}

type Coords = { start: number; end: number }
const overlaps = (a: Coords, b: Coords) => a.end >= b.start && b.end >= a.start

export const getNewFlashcardForStretchedClip = (
  state: AppState,
  noteType: NoteType,
  { start, end, flashcard }: Clip,
  { start: stretchStart, end: stretchEnd }: { start: number; end: number },
  direction: 'PREPEND' | 'APPEND'
): Flashcard => {
  const links = getSubtitlesFlashcardFieldLinks(state)
  if (!Object.keys(links).length) return flashcard

  const originalFields: TransliterationFlashcardFields = flashcard.fields as any
  const newFields: TransliterationFlashcardFields = { ...originalFields }

  for (const fn in links) {
    const fieldName = fn as TransliterationFlashcardFieldName
    const trackId = links[fieldName]
    const originalText = originalFields[fieldName]
    const newlyOverlapped = (chunk: SubtitlesChunk) =>
      !originalText.trim() || !overlaps({ start, end }, chunk)
    const chunks = trackId
      ? getSubtitlesChunksWithinRange(
          state,
          trackId,
          stretchStart,
          stretchEnd
        ).filter(newlyOverlapped)
      : []

    const newText = chunks.map(chunk => chunk.text).join('\n')

    newFields[fieldName] = (direction === 'PREPEND'
      ? [newText, originalText]
      : [originalText, newText]
    )
      .filter(t => t.trim())
      .join('\n')
  }

  if (
    Object.keys(newFields).every(
      k =>
        originalFields[k as TransliterationFlashcardFieldName] ===
        newFields[k as TransliterationFlashcardFieldName]
    )
  )
    return flashcard

  return { ...flashcard, fields: newFields }
}

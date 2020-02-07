import { getClip } from './clips'

type ExpandedPendingStretch = {
  id: ClipId
  start: WaveformX
  end: WaveformX
}

export const getPendingStretch = (
  state: AppState
): ExpandedPendingStretch | null => {
  if (!state.clips) return null
  const { pendingStretch } = state.session
  if (!pendingStretch) return null

  const stretchedClip = getClip(state, pendingStretch.id)
  if (!stretchedClip)
    throw new Error('Impossible: no stretched clip ' + pendingStretch.id)

  const { originKey } = pendingStretch
  const [start, end] = [pendingStretch.end, stretchedClip[originKey]].sort()
  return { id: pendingStretch.id, start, end }
}

export const getHighlightedClipId = (state: AppState): ClipId | null =>
  state.session.highlightedClipId

export const getHighlightedClip = (state: AppState): Clip | null => {
  const highlightedClipId = getHighlightedClipId(state)
  return highlightedClipId ? getClip(state, highlightedClipId) : null
}

export const getPendingClip = (state: AppState): PendingClip | null =>
  state.session.pendingClip

export const getAllTags = (state: AppState): Array<string> => {
  const tags = Object.keys(state.session.tagsToClipIds)
  return tags.reduce((a, b) => a.concat(b), [] as Array<string>)
}
export const getDefaultTags = (state: AppState): Array<string> =>
  state.session.defaultTags

export const getDefaultIncludeStill = (state: AppState): boolean =>
  state.session.defaultIncludeStill
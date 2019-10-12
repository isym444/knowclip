import { basename } from 'path'
import {
  getCurrentFilePath,
  getProjectMetadata,
  getCurrentProject,
} from './project'

export const isLoopOn = (state: AppState) => state.audio.loop

export const getCurrentFileName = (state: AppState): MediaFileName | null => {
  const filePath = getCurrentFilePath(state)
  return filePath && basename(filePath)
}

export const getCurrentFileId = ({ user }: AppState): MediaFileId | null =>
  user.currentMediaFileId

const empty: Array<ClipId> = []
export const getClipsOrder = (
  state: AppState,
  mediaFileId: MediaFileId
): Array<ClipId> => {
  const clips = state.clips.idsByMediaFileId[mediaFileId]
  return clips || empty
}

export const getCurrentFileClipsOrder = (state: AppState): Array<ClipId> => {
  const currentFileId = getCurrentFileId(state)
  if (!currentFileId) return empty
  return getClipsOrder(state, currentFileId)
}

export const doesFileHaveClips = (
  state: AppState,
  fileId: MediaFileId
): boolean => {
  return Boolean(state.clips.idsByMediaFileId[fileId].length)
}

export const doesCurrentFileHaveClips = (state: AppState): boolean => {
  const currentFileId = getCurrentFileId(state)
  return Boolean(
    currentFileId && state.clips.idsByMediaFileId[currentFileId].length
  )
}

export const getCurrentNoteType = (state: AppState): NoteType | null => {
  const currentProject = getCurrentProject(state)
  return currentProject ? currentProject.noteType : null
}

export const getMediaFilePaths = (
  state: AppState,
  projectId: ProjectId
): Array<AudioMetadataAndPath> => {
  const projectMetadata = getProjectMetadata(state, projectId)
  return projectMetadata ? projectMetadata.mediaFilePaths : []
}
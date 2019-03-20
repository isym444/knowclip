// @flow
import fs from 'fs'
import { initialState as initialNoteTypeState } from '../reducers/noteTypes'
import { PROJECT_FILE_VERSION_MISMATCH_MESSAGE } from '../selectors/snackbar'
import parseProject from '../utils/parseProject'

// export const persistState = (state: AppState) => {
//   const { audio, noteTypes } = state
//   window.localStorage.setItem('audio', JSON.stringify(audio))
//   // window.localStorage.setItem('clips', JSON.stringify(clips))
//   window.localStorage.setItem('noteTypes', JSON.stringify(noteTypes))
// }

const areNoteTypesEqual = (a: NoteType, b: NoteType): boolean =>
  a.id === b.id &&
  a.name === b.name &&
  a.fields.length === b.fields.length &&
  a.fields.every(
    (field, i) => field.id === b.fields[i].id && field.name === b.fields[i].name
  )

export const hydrateFromProjectFile = (
  existingProjectFilePath: string,
  audioFilePath: AudioFilePath,
  mediaFolderLocation: ?string,
  noteTypes: ?NoteTypesState
): ?$Shape<AppState> => {
  const jsonFileContents = fs.readFileSync(existingProjectFilePath, 'utf8')
  const project = parseProject(jsonFileContents)

  console.log('project', project)
  console.log('audioFilePath', audioFilePath)
  if (!project) return null

  const localNoteType = noteTypes && noteTypes.byId[project.noteType.id]
  const noteType =
    !localNoteType || areNoteTypesEqual(localNoteType, project.noteType)
      ? project.noteType
      : {
          ...project.noteType,
          id: `${project.noteType.id}_fork`,
          name: `${project.noteType.name}_fork`,
        }
  const noteTypesBase = noteTypes || initialNoteTypeState
  const { audioFileId } = project

  return {
    audio: ({
      loop: true,
      files: {
        [audioFileId]: {
          id: audioFileId,
          path: audioFilePath,
          noteTypeId: noteType.id,
        },
      },
      filesOrder: [audioFileId],
      currentFileIndex: 0,
      isLoading: false,
      mediaFolderLocation,
    }: AudioState),
    clips: {
      idsByAudioFileId: {
        [audioFileId]: Object.keys(project.clips).sort(
          (a, b) => project.clips[a].start - project.clips[b].start
        ),
      },
      byId: project.clips,
    },
    noteTypes: {
      ...noteTypesBase,
      byId: {
        ...noteTypesBase.byId,
        [noteType.id]: noteType,
      },
      allIds: [...new Set(noteTypesBase.allIds.concat(noteType.id))],
    },
  }
}

export const getProjectFilePath = (filePath: AudioFilePath): string =>
  `${filePath}.afca`
export const findExistingProjectFilePath = (
  filePath: AudioFilePath
): ?string => {
  const jsonPath = getProjectFilePath(filePath)
  return filePath && fs.existsSync(jsonPath) ? jsonPath : null
}

export const getPersistedState = (): $Shape<AppState> => {
  const persistedState: $Shape<AppState> = {}
  try {
    const projects = JSON.parse(window.localStorage.getItem('projects'))
    if (projects) persistedState.projects = projects
  } catch (err) {
    console.error(err)
  }

  return persistedState
}

export const getPersistedState_old = (): $Shape<AppState> => {
  const persistedState = ({}: $Shape<{
    audio: AudioState,
    noteTypes: NoteTypesState,
  }>)

  let error

  try {
    const stateParts = ['audio', 'noteTypes']
    stateParts.forEach(x => {
      const stored = JSON.parse(window.localStorage.getItem(x))
      if (!stored) return
      persistedState[x] = stored
    })
    const filePath =
      persistedState &&
      persistedState.audio &&
      persistedState.audio.filesOrder &&
      persistedState.audio.filesOrder[0]
    const mediaFolderLocation =
      persistedState &&
      persistedState.audio &&
      persistedState.audio.mediaFolderLocation
    const projectFilePath = findExistingProjectFilePath(filePath)
    if (projectFilePath) {
      const hydrated = hydrateFromProjectFile(
        projectFilePath,
        filePath,
        mediaFolderLocation,
        persistedState.noteTypes
      )
      return (
        hydrated || {
          noteTypes: persistedState.noteTypes,
          snackbar: {
            queue: {
              type: 'SimpleMessage',
              props: { message: PROJECT_FILE_VERSION_MISMATCH_MESSAGE },
            },
          },
        }
      )
    }
  } catch (err) {
    console.error(err)
  }
  return {
    noteTypes: persistedState.noteTypes,
    audio: {
      ...persistedState.audio,
      loop: true,
      files: {},
      filesOrder: [],
      currentFileIndex: 0,
      isLoading: false,
    },
  }
}

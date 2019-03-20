// @flow
import uuid from 'uuid/v4'

const convertProject0_0_0___1_0_0 = (project: Project0_0_0): Project1_0_0 => {
  const { clips: oldClips } = project
  const newClips: { [ClipId]: Clip } = {}
  const fileId = uuid()
  for (const clipId in oldClips) {
    const clip = oldClips[clipId]
    const { flashcard } = clip
    newClips[clipId] = {
      id: clip.id,
      start: clip.start,
      end: clip.end,
      flashcard: {
        id: clipId,
        fields: flashcard.fields,
        tags: flashcard.tags || [],
      },
      fileId,
    }
  }

  return {
    version: '1.0.0',
    audioFileName: project.audioFileName,
    noteType: project.noteType,
    clips: newClips,
    audioFileId: fileId,
  }
}
const convertProject1_0_0___2_0_0 = (project: Project1_0_0): Project2_0_0 => {
  const clips: Array<Clip> = (Object.values(project.clips): any)
  return {
    version: '2.0.0',
    id: uuid(),
    name: `Clips from ${project.audioFileName}`,
    tags: [
      ...clips.reduce(
        (tags, clip: Clip) => {
          clip.flashcard.tags.forEach(tag => tags.add(tag))
          return tags
        },
        new Set()
      ),
    ],
    mediaFilesMetadata: [
      {
        id: project.audioFileId,
        durationSeconds: 0,
        format: 'UNKNOWN',
        name: project.audioFileName,
      },
    ],
    noteType: project.noteType,
    clips: project.clips,
  }
}
const parseProject = (jsonFileContents: string): ?Project2_0_0 => {
  const project: Project = JSON.parse(jsonFileContents)
  switch (project.version) {
    case '0.0.0':
      return convertProject1_0_0___2_0_0(convertProject0_0_0___1_0_0(project))
    case '1.0.0':
      return convertProject1_0_0___2_0_0(project)
    case '2.0.0':
      return project
    default:
      return null
  }
}

export default parseProject

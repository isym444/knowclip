import { TestSetup } from '../../setUpDriver'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'

export default async function openSavedProject({ client }: TestSetup) {
  await client.clickElement_(projectsMenu$.recentProjectsListItem)
  await client.waitForText_(
    mediaFilesMenu$.openMediaFilesMenuButton,
    'piggeldy_cat.mp4'
  )
  await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
  await client.clickElement_(mediaFilesMenu$.mediaFileMenuItem)

  await client.waitForText_(
    mediaFilesMenu$.openMediaFilesMenuButton,
    'polar_bear_cafe.mp4'
  )

  await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)

  const mediaFiles = await client.elements_(mediaFilesMenu$.mediaFileMenuItem)

  await mediaFiles[1].click()

  await client.waitForText_(
    mediaFilesMenu$.openMediaFilesMenuButton,
    'piggeldy_cat.mp4'
  )
}

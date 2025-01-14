import { testBlock, TestSetup } from '../../setUpDriver'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { waveform$ } from '../../../components/waveformTestLabels'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'
import { ClientWrapper } from '../../driver/ClientWrapper'

export default async function moveThroughoutMedia({ client }: TestSetup) {
  await testBlock('seek to new time in video', async () => {
    const waveformClips = await client.elements_(waveform$.waveformClip)
    expect(
      await Promise.all(waveformClips.map((c) => c.isVisible()))
    ).toMatchObject([true, true])
    await setVideoTime(client, 61)

    await client.waitUntilGone_(waveform$.waveformClip)
  })

  await testBlock(
    'shift waveform view by creating clip at screen edge',
    async () => {
      await waveformMouseDrag(client, 710, 1008)
      await client.waitForText('body', '3 / 3')

      await client.waitUntil(async () => {
        try {
          const visibility = (await clipsVisibility(client)).join(' ')
          return visibility === 'true'
        } catch (err) {
          console.error(err)
          throw new Error(
            'Something went wrong when waiting for visiblity: ' + String(err)
          )
        }
      })
      expect(await clipsVisibility(client)).toMatchObject([true])

      await client.waitUntil(async () => {
        const clip = await client.firstElement_(waveform$.waveformClip)
        return Boolean(await clip.getAttribute('data-clip-is-highlighted'))
      })
    }
  )

  await testBlock(
    'shift waveform view by navigating with previous button',
    async () => {
      if (process.platform === 'linux') await client._driver.client.pause(1000)
      await client.clickElement_(flashcardSection$.previousClipButton)
      await client.waitForText('body', '2 / 3')

      await client.waitUntil(async () => {
        return (await clipsVisibility(client)).join(' ') === 'true'
      })
      expect(await clipsVisibility(client)).toMatchObject([true])
      expect(
        Number(await client.getAttribute('video', 'currentTime'))
      ).toBeLessThan(53)
    }
  )
}

async function clipsVisibility(wrapper: ClientWrapper) {
  return await Promise.all(
    await (
      await wrapper.elements_(waveform$.waveformClip)
    ).map((el) => el.isVisible())
  )
}

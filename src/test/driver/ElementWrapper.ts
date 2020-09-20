import { BrowserObject, Element } from 'webdriverio'

/** A wrapper for `WebDriverIO.Client` method results
 * for when the `ClientWrapper` methods can't be called directly, e.g.
 * when targeting specific elements queried via `ClientWrapper#elements`.
 */
export interface ElementWrapper {
  elementId: string
  selector: string
  setFieldValue: (value: string) => Promise<void>
  click: () => Promise<void>
  clickAtOffset: (opts: { x: number; y: number }) => Promise<void>
  getText: () => Promise<string>
  waitForText: (text: string) => Promise<void>
  doubleClick: () => Promise<void>
  isVisible: () => Promise<boolean>
  isVisibleOrDisplayed: () => Promise<boolean>
  isExisting: () => Promise<boolean>
  isSelected: () => Promise<boolean>
  getAttribute: (attributeName: string) => Promise<string | null>
}

export const element = (
  client: BrowserObject,
  element: Element,
  selector: string
): ElementWrapper => {
  const getText = async () => {
    try {
      const result = await element.getText()

      if (typeof result !== 'string') {
        console.error(result, JSON.stringify(result))
        throw new Error(
          'Could not get text, instead got ' +
            (result && JSON.stringify(result as any))
        )
      }

      return result
    } catch (err) {
      throw err
    }
  }

  const id = element.elementId
  return {
    elementId: id,
    selector,
    setFieldValue: async (value: string) => {
      await element.setValue(value)
    },
    click: async () => {
      try {
        await element.click()
      } catch (err) {
        throw new Error(`Could not click element "${selector}": ${err}`)
      }
    },
    doubleClick: async () => {
      try {
        await element.doubleClick()
      } catch (err) {
        throw new Error(`Could not double-click element "${selector}": ${err}`)
      }
    },
    getText,
    waitForText: async (text: string) => {
      let found
      try {
        await client.waitUntil(async () => {
          found = await getText()
          return Boolean(found) && found.includes(text)
        })
      } catch (err) {
        throw new Error(
          typeof found === 'string'
            ? `Selector "${selector}" received not "${text}", but "${found}", and then there was a problem: ${
                err.message
              }`
            : `Could not get text from "${selector}: ` + err.message
        )
      }
    },
    isVisible: async () => {
      try {
        return await client.isElementDisplayed(id)
      } catch (err) {
        throw Error(`Could not get displayed status of "${selector}": ${err}`)
      }
    },
    isVisibleOrDisplayed: async () => {
      try {
        return await element.isDisplayed()
      } catch (err) {
        throw Error(`Could not get displayed status of "${selector}": ${err}`)
      }
    },
    isExisting: async () => {
      try {
        return await element.isExisting()
      } catch (err) {
        throw Error(`Could not get displayed status of "${selector}": ${err}`)
      }
    },
    getAttribute: async (attributeName: string) => {
      try {
        return element.getAttribute(attributeName)
      } catch (err) {
        throw new Error(
          `Could not get ${attributeName} attribute of "${selector}": ${err}`
        )
      }
    },
    isSelected: async () => {
      return await client.isElementSelected(id)
    },
    clickAtOffset: async ({ x, y }: { x: number; y: number }) => {
      try {
        await element.click({ x, y })
      } catch (err) {
        throw new Error(
          `Could not click "${selector}" at offset ${x} ${y}: ${err}`
        )
      }
    },
  }
}

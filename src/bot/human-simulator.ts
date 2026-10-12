import { Page } from 'playwright'

/**
 * Standard sleep utility
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Generates an integer between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Pauses execution with human-like randomized jitter delay.
 * Emits progress every 10 seconds to keep CLI / logs updated.
 */
export async function randomJitterDelay(
  minSeconds: number,
  maxSeconds: number,
  actionReason: string = 'safety cooldown'
): Promise<void> {
  const targetSeconds = randomBetween(minSeconds, maxSeconds)
  console.log(
    `⏳ [Human Delay] Pausing for ${targetSeconds}s (${actionReason}) to mimic realistic human behavior...`
  )

  const startTime = Date.now()
  const totalMs = targetSeconds * 1000

  while (Date.now() - startTime < totalMs) {
    const remainingMs = totalMs - (Date.now() - startTime)
    const sleepChunk = Math.min(remainingMs, 5000)
    await sleep(sleepChunk)
  }

  console.log(`✨ [Human Delay] Finished ${targetSeconds}s cooldown. Resuming next operation.`)
}

/**
 * Simulates human typing keystroke-by-keystroke with random jitter,
 * occasional brief thinking pauses, and natural variance.
 */
export async function simulateHumanTyping(
  page: Page,
  selector: string,
  text: string,
  minDelayMs = 50,
  maxDelayMs = 175
): Promise<void> {
  const element = page.locator(selector).first()
  await element.click()
  await sleep(randomBetween(200, 500))

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    // Type character
    await element.pressSequentially(char, { delay: randomBetween(minDelayMs, maxDelayMs) })

    // Occasional human pause between words (as if thinking what to type next)
    if (char === ' ' && Math.random() < 0.25) {
      await sleep(randomBetween(250, 650))
    }

    // Occasional micro-pause after punctuation marks
    if (['.', ',', '!', '?'].includes(char)) {
      await sleep(randomBetween(350, 800))
    }
  }

  // Brief review pause after typing
  await sleep(randomBetween(800, 1600))
}

/**
 * Simulates human scrolling down and up a profile to mimic reading.
 */
export async function simulateHumanScroll(page: Page): Promise<void> {
  const scrollSteps = randomBetween(2, 4)

  for (let i = 0; i < scrollSteps; i++) {
    const scrollAmount = randomBetween(250, 600)
    await page.mouse.wheel(0, scrollAmount)
    await sleep(randomBetween(800, 2200)) // Pause as if reading a section

    // 25% chance to scroll slightly back up (natural eye backtracking)
    if (Math.random() < 0.25) {
      await page.mouse.wheel(0, -randomBetween(100, 200))
      await sleep(randomBetween(500, 1200))
    }
  }

  // Scroll back smoothly towards the top connect section
  await page.mouse.wheel(0, -800)
  await sleep(randomBetween(600, 1500))
}

/**
 * Simulates natural micro mouse movements around the viewport
 */
export async function simulateRandomCursorMovement(page: Page): Promise<void> {
  const points = randomBetween(2, 4)
  for (let i = 0; i < points; i++) {
    const x = randomBetween(150, 850)
    const y = randomBetween(150, 650)
    await page.mouse.move(x, y, { steps: randomBetween(8, 18) })
    await sleep(randomBetween(150, 400))
  }
}

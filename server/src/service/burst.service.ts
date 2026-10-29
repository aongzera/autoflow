export type PhotoLite = { id: number; createdAt: Date; lineGroupId: string | null; lineSenderId: string | null }

// photos must be sorted by group, sender, then createdAt (oldest first)
export function groupIntoBursts(photos: PhotoLite[], gapMs: number): PhotoLite[][] {
  const bursts: PhotoLite[][] = []

  for (const photo of photos) {
    const current = bursts[bursts.length - 1]
    const prev = current?.[current.length - 1]

    const startsNew =
      !prev ||
      prev.lineGroupId !== photo.lineGroupId ||
      prev.lineSenderId !== photo.lineSenderId ||
      photo.createdAt.getTime() - prev.createdAt.getTime() > gapMs

    if (startsNew) bursts.push([photo])
    else current.push(photo)
  }
  return bursts
}

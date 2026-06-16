type PrintMode = 'kitchen' | 'cashier'

export function printArea(printId: string, mode: PrintMode) {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-print-id]'))
  const target = targets.find((element) => element.dataset.printId === printId)

  if (!target) {
    window.print()
    return
  }

  const activeTarget = target

  function cleanup() {
    document.body.removeAttribute('data-print-mode')
    activeTarget.removeAttribute('data-print-active')
    window.removeEventListener('afterprint', cleanup)
  }

  targets.forEach((element) => element.removeAttribute('data-print-active'))
  document.body.dataset.printMode = mode
  activeTarget.setAttribute('data-print-active', 'true')
  window.addEventListener('afterprint', cleanup)
  window.print()
  window.setTimeout(cleanup, 800)
}

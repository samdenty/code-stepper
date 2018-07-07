import * as Monaco from 'monaco-editor'

import Stepper from '../stepper'

interface IMonacoStepper {
  monaco: typeof Monaco
  editor: Monaco.editor.IStandaloneCodeEditor
}

export let monaco: typeof Monaco
export const NORMAL = 'debug-breakpoint'
export const ACTIVE = NORMAL + '-active'

class MonacoStepper {
  private editor: IMonacoStepper['editor']
  public stepper = new Stepper(this.code)

  constructor(private options: IMonacoStepper, public code: string) {
    this.editor = options.editor
    monaco = options.monaco

    this.editor.updateOptions({ glyphMargin: true })

    this.addDecorators()
    this.addListeners()
  }

  public addDecorators() {
    this.editor.deltaDecorations(
      [],
      [
        {
          range: new monaco.Range(0, 0, Infinity, 0),
          options: {
            glyphMarginClassName: NORMAL
          }
        }
      ]
    )
  }

  public addListeners() {
    const node = this.editor.getDomNode()
    const breakpointTriggers = node.getElementsByClassName(NORMAL)
    setInterval(() => {
      for (let i = 0; i < breakpointTriggers.length; i++) {
        const trigger = breakpointTriggers[i] as HTMLElement
        if (!trigger.onmousedown) this.hookTrigger(trigger)
      }
    }, 200)
  }

  private hookTrigger(trigger: HTMLElement) {
    const line = +(<any>trigger).parentElement.getElementsByClassName(
      'line-numbers'
    )[0].innerText

    trigger.onmousedown = () => {
      const result = this.stepper.toggleBreakpoint(line)
      console.log('clicked', line, result)
      trigger.classList.toggle(ACTIVE)
    }
  }
}

export default MonacoStepper

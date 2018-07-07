import * as Monaco from 'monaco-editor'

import Stepper from '../stepper'

interface IMonacoStepper {
  monaco: typeof Monaco
  editor: Monaco.editor.IStandaloneCodeEditor
}

export let monaco: typeof Monaco

export const enum Classes {
  normal = 'debug-breakpoint',
  active = 'debug-breakpoint-active',
  disabled = 'debug-breakpoint-disabled'
}

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
            glyphMarginClassName: Classes.normal
          }
        }
      ]
    )
  }

  public addListeners() {
    const node = this.editor.getDomNode()
    const breakpointTriggers = node.getElementsByClassName(Classes.normal)
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

    const updateTrigger = (breakpoint = this.stepper.getBreakpoint(line)) => {
      trigger.classList.toggle(Classes.active, !!breakpoint)
      trigger.classList.toggle(Classes.disabled, breakpoint.disabled)
    }

    trigger.onmousedown = () => {
      console.log('clicked', line)
      const breakpoint = this.stepper.toggleBreakpoint(line)
      updateTrigger(breakpoint)
    }
  }
}

export default MonacoStepper

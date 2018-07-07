import EventEmitter from 'eventemitter3'

import stepped from './util/stepped'

type EvalInContext = (code: string) => any

export interface Breakpoint {
  line: number
  disabled: boolean
  condition?: string
}

export type Events =
  | 'run'
  | 'resumed'
  | 'paused'
  | 'context'
  | 'breakpointAdded'
  | 'breakpointRemoved'
  | 'breakpointEnabled'
  | 'breakpointDisabled'

class Stepper extends EventEmitter<Events> {
  public lineCount: number
  public paused: boolean
  public breakpoints = new Array<Breakpoint>()

  private debugger: Function
  private context: {
    line: number
    evalInContext: EvalInContext
    resume: Function
  }

  constructor(inputCode: string) {
    super()
    const { stepper, lineCount } = stepped(inputCode, this.step.bind(this))
    this.debugger = stepper
    this.lineCount = lineCount
  }

  /**
   * Runs the script
   */
  public run() {
    if (typeof this.paused !== 'boolean') this.debugger()
    this.resume()
    this.emit('run')
  }

  /**
   * Resumes script execution
   */
  public resume() {
    this.paused = false
    if (this.context) this.context.resume()
    this.context = null
    this.emit('resumed')
  }

  /**
   * Pauses script execution
   */
  public pause() {
    this.paused = true
    this.emit('paused')
  }

  /**
   * Evaluates code in the paused context
   * @param code The code to evaluate
   */
  public eval(code: string) {
    if (!this.context) throw new Error(`No context to evaluate in!`)

    return this.context.evalInContext(code)
  }

  /**
   * Gets the line number the debugger is paused on
   */
  public getLine(): number | Promise<number> {
    // If it's not paused, return null
    if (!this.paused) return null

    // If the context doesn't yet exist, return a promise
    if (!this.context)
      return new Promise(resolve =>
        this.once('context', () => resolve(this.context.line))
      )

    return this.context.line
  }

  /**
   * Returns the breakpoint for a given line
   */
  public getBreakpoint(line: number) {
    const breakpoint = this.breakpoints.find(b => b.line === line)
    return breakpoint
  }

  /**
   * Adds a new breakpoint for a specified line
   * @param line Line number to break on
   * @param condition The condition for which it should break (evaluated expression)
   */
  public addBreakpoint(line: number, condition?: string) {
    const existing = this.getBreakpoint(line)

    if (existing) {
      existing.condition = condition
      return existing
    }

    const index = this.breakpoints.push({
      line,
      disabled: false,
      condition
    })

    const breakpoint = this.breakpoints[index - 1]
    this.emit('breakpointAdded', breakpoint)

    return breakpoint
  }

  /**
   * Removes a breakpoint for a specified line
   * @param line Line number to remove
   */
  public removeBreakpoint(line: number) {
    const index = this.breakpoints.findIndex(b => b.line === line)

    if (index > -1) {
      this.emit('breakpointRemoved', line)
      this.breakpoints.splice(index, 1)
    }
  }

  /**
   * Re-enables a breakpoint for a given line
   * @param line Line number to enable
   */
  public enableBreakpoint(line: number) {
    const breakpoint = this.getBreakpoint(line)

    if (breakpoint) {
      this.emit('breakpointEnabled', breakpoint)
      breakpoint.disabled = false
    }
    return breakpoint
  }

  /**
   * Disables a breakpoint for a given line
   * @param line Line number to enable
   */
  public disableBreakpoint(line: number) {
    const breakpoint = this.getBreakpoint(line)

    if (breakpoint) {
      this.emit('breakpointDisabled', breakpoint)
      breakpoint.disabled = true
    }
    return breakpoint
  }

  /**
   * Toggles a breakpoint for a given line
   * @param line Line number to toggle
   */
  public toggleBreakpoint(line: number) {
    const breakpoint = this.getBreakpoint(line)

    if (breakpoint) {
      return breakpoint.disabled
        ? this.enableBreakpoint(line)
        : this.disableBreakpoint(line)
    }

    return this.addBreakpoint(line)
  }

  /**
   * Called by the users script on each line run
   */
  private step(line: number, evalInContext: EvalInContext) {
    const breakpoint = this.getBreakpoint(line)

    if (breakpoint && !breakpoint.disabled) {
      if (breakpoint.condition) {
        const shouldBreak = evalInContext(breakpoint.condition)
        if (shouldBreak) this.pause()
      } else {
        this.pause()
      }
    }

    if (this.paused)
      return new Promise(resume => {
        if (this.context) return

        this.context = {
          evalInContext,
          line,
          resume
        }
        this.emit('context', this.context)
      })
  }
}

export default Stepper

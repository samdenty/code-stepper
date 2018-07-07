import stepped from './util/stepped'

type EvalInContext = (code: string) => any

export interface Breakpoint {
  line: number
  disabled: boolean
  condition?: string
}

class Stepper {
  public lineCount: number
  public paused: boolean
  public breakpoints = new Array<Breakpoint>()

  private stepper: Function
  private context: {
    line: number
    evalInContext: EvalInContext
    resume: Function
  }

  constructor(inputCode: string) {
    const { stepper, lineCount } = stepped(inputCode, this.step.bind(this))
    this.stepper = stepper
    this.lineCount = lineCount
  }

  /**
   * Runs the script
   */
  public run() {
    if (typeof this.paused !== 'boolean') this.stepper()
    this.resume()
  }

  /**
   * Resumes script execution
   */
  public resume() {
    this.paused = false
    if (this.context) this.context.resume()
    this.context = null
  }

  /**
   * Pauses script execution
   */
  public pause = () => (this.paused = true)

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
  public get pausedLine() {
    if (!this.context) return null

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
    } else {
      this.breakpoints.push({
        line,
        disabled: false,
        condition
      })
    }
  }

  /**
   * Removes a breakpoint for a specified line
   * @param line Line number to remove
   */
  public removeBreakpoint(line: number) {
    const index = this.breakpoints.findIndex(b => b.line === line)

    if (index > -1) this.breakpoints.splice(index, 1)
  }

  /**
   * Re-enables a breakpoint for a given line
   * @param line Line number to enable
   */
  public enableBreakpoint(line: number) {
    const breakpoint = this.getBreakpoint(line)

    if (breakpoint) breakpoint.disabled = false
  }

  /**
   * Disables a breakpoint for a given line
   * @param line Line number to enable
   */
  public disableBreakpoint(line: number) {
    const breakpoint = this.getBreakpoint(line)

    if (breakpoint) breakpoint.disabled = true
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
      })
  }
}

export default Stepper

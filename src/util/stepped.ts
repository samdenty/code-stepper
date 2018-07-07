import { random } from '.'
import asyncify from './asyncify'

const stepped = (
  inputCode: string,
  lineStepper: (
    lineNumber: number,
    evalInContext: (code: string) => any
  ) => void
) => {
  const stepperFn = `stepper$${random()}$${+new Date()}`

  const parsed = inputCode.split('\n')
  const [body, lineCount]: any[] = parsed.reduce(
    ([prevValue, prevNumber], line) => {
      const lineNumber = +prevNumber + 1
      const value = `${line}\n${stepperFn}(${lineNumber});\n`

      return [prevValue + value, lineNumber]
    },
    ['', 0]
  )

  // Mark as referenced
  lineStepper

  const steppee = `function ${stepperFn}(i){return lineStepper(i,function(code) { return eval(code) })}`
  const stepper: Function = eval(
    `(async function() {${steppee};${asyncify(body)}})`
  )

  return { stepper, lineCount }
}

export default stepped

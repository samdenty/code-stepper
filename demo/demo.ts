import Stepper, { MonacoStepper } from '../src'
import loadMonaco from './monaco'

async function main() {
  const monaco = await loadMonaco()

  const code = `
  function asd() {
    function nested() {
      return btoa('testing')
    }
    setInterval(() => {
      console.log('timer')
    }, 500)
    return nested()
  }

  console.log(asd())
`

  const editor = monaco.editor.create(document.getElementById('demo'), {
    value: code,
    language: 'javascript'
  })

  const monacoStepper = new MonacoStepper({ monaco, editor }, code)

  // Debugging
  ;(window as any).monacoStepper = monacoStepper
  ;(window as any).stepper = monacoStepper.stepper
  ;(window as any).editor = editor
  ;(window as any).monaco = monaco
}

main()

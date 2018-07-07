import Stepper from '../src'

const stepper = new Stepper(`
  function asd() {
    function nested() {
      return btoa('asd')
    }
    setInterval(() => {
      console.log(+new Date()+'timer')
    }, 500)
    return nested()
  }

  console.log(asd())
`)

stepper.run()
;(window as any).stepper = stepper

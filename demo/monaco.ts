import * as Monaco from 'monaco-editor'

const loadMonaco = () => {
  return new Promise<typeof Monaco>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor/dev/vs/loader.js'

    script.onerror = reject
    script.onload = () => {
      const { require: $require } = window as any
      $require.config({
        paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor/dev/vs' }
      })
      $require(['vs/editor/editor.main'], () => {
        resolve((window as any).monaco)
      })
    }
    document.head.appendChild(script)
  })
}

export default loadMonaco

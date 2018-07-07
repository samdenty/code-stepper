import { parse } from 'acorn'
import { generate } from 'astring'
import { Program } from 'estree'

/**
 * Makes code fully async by converting all functions to
 * async, and making all function calls awaited.
 * @param code The code to convert
 */
const asyncify = code => {
  const ast = parse(code, {
    ranges: false,
    ecmaVersion: 8
  })
  iterate(ast)

  return generate(ast)
}

const fix = (node, circular: any[]) => {
  // Make all functions Async
  if (node.async === false) node.async = true

  // Make all call expressions awaited
  if (node.type === 'CallExpression' && !node.argument) {
    node.type = 'AwaitExpression'
    const argument = {
      type: 'CallExpression',
      arguments: node.arguments,
      callee: node.callee
    }
    circular.push(argument)
    node.argument = argument
  }
}

const iterate = (ast: Program) => {
  let circular = []
  function recurse(obj) {
    for (const property in obj) {
      if (obj.hasOwnProperty(property)) {
        const node = obj[property]
        if (node instanceof Object && circular.indexOf(node) === -1) {
          fix(node, circular)
          recurse(node)
        }
      }
    }
  }
  recurse(ast)
}

export default asyncify

import Debug from 'debug'

import {
  simulateDOMNodeBeforeMutations,
  findSimulatedNodeRecursively,
} from '../../utils/dom-simulator'

import {
  processCharacterData,
  processChildList,
  processSelect,
} from '../../utils/process-mutations.js'

import { Block, Range, Point, Text } from 'slate'
import getWindow from 'get-window'

/**
 * @type {Debug}
 */

const debug = Debug('slate:mutation-manager')

function getPointSlate(editor, point) {
  const path = [...point.path]

  let node = editor.value.document.getNode(path)

  while (!Text.isText(node)) {
    path.push(0)
    node = node.getChild([0])
  }

  return Point.create({
    path,
    offset: point.offset,
  })
}

function resolveRange(editor, rangePath, forNode = false) {
  const lengthPath = rangePath.anchor.path.length

  const document = editor.value.document
  const rangeText = Range.fromJSON({
    anchor: getPointSlate(editor, rangePath.anchor),
    focus: getPointSlate(editor, rangePath.focus),
  })
  const range = rangeText.normalize(document)

  if (!forNode) {
    return range
  }

  let key = range.start.key

  for (let i = lengthPath; i < 2; i++) {
    const parent = editor.value.document.getParent(key)
    key = parent.key
  }
  return Range.fromJSON({
    anchor: { key, offset: range.start.offset, path: rangePath.anchor.path },
    focus: { key, offset: range.end.offset, path: rangePath.focus.path },
  })
}

function makeSlateCommandArgs(editor, command) {
  switch (command.type) {
    case 'insertText': {
      return [command.text]
    }
    case 'select': {
      const range = resolveRange(editor, command.range)
      return [range]
    }
    case 'insertTextAtRange': {
      const range = resolveRange(editor, command.range)
      return [range, command.text]
    }
    case 'deleteBackward': {
      return [command.n]
    }
    case 'deleteAtRange': {
      const range = resolveRange(editor, command.range)
      return [range, command.text]
    }
    case 'insertNodeByKey': {
      const node = command.node === 'block' ? Block.create('') : Text.create('')
      const range = Range.fromJSON({
        anchor: command.range.anchor,
        focus: command.range.focus,
      })
      const document = editor.value.document
      const parent = document.getNode(range.start.path)
      const key = parent.key
      const index = command.index
      return [key, index, node]
    }
    case 'removeNodeByPath': {
      return [command.path]
    }
    case 'splitInlineAtRange': {
      const range = resolveRange(editor, command.range)
      return [range]
    }
    case 'splitBlockAtRange': {
      const range = resolveRange(editor, command.range)
      return [range]
    }
    case 'splitBlock':
    case 'splitInline':
    case 'restoreDOM': {
      return []
    }

    default: {
      throw new Error('Missing command')
    }
  }
}

function commandsFromMutations(mutations, editorNode) {
  const commands = []

  mutations.forEach((mutation, index) => {
    mutation.idx = index

    const simulatedNodeSlateRootBefore = simulateDOMNodeBeforeMutations(
      editorNode,
      mutations.slice(index)
    )
    const simulatedNodeSlateRootAfter = simulateDOMNodeBeforeMutations(
      editorNode,
      mutations.slice(index + 1)
    )

    const context = {
      simulatedNodeSlateRootBefore,
      simulatedNodeSlateRootAfter,
      simulatedTargetBefore: findSimulatedNodeRecursively(
        mutation.target,
        simulatedNodeSlateRootBefore
      ),
      simulatedTargetAfter: findSimulatedNodeRecursively(
        mutation.target,
        simulatedNodeSlateRootAfter
      ),
    }

    if (mutation.type === 'characterData') {
      commands.push(...processCharacterData(mutation, context))
    } else if (mutation.type === 'childList') {
      commands.push(...processChildList(mutation, context))
    }
  })

  return commands
}

/**
 * Based loosely on:
 *
 * https://github.com/facebook/draft-js/blob/master/src/component/handlers/composition/DOMObserver.js
 * https://github.com/ProseMirror/prosemirror-view/blob/master/src/domobserver.js
 *
 * But is an analysis mainly for `backspace` and `enter` as we handle
 * compositions as a single operation.
 *
 * @param {} element
 */

function MutationManager(editor) {
  /**
   * A MutationObserver that flushes to the method `flush`
   *
   * @type {MutationObserver}
   */

  const observer = new window.MutationObserver(flush)

  /**
   * Object that keeps track of the most recent state
   *
   * @type {Range}
   */

  const state = {
    rootEl: null, // root element that MutationObserver is attached to
    compositionMutations: [], // accumulated mutations since the start of a composition
    compositionCommands: [], // accumulated commands since the start of a composition
    isComposing: false, // is the component is actually composing
  }

  /**
   * Connect the MutationObserver to a specific editor root element
   */

  function connect() {
    debug('connect', { rootEl })

    const rootEl = editor.findDOMNode([])

    if (state.rootEl === rootEl) {
      return
    }

    getWindow(rootEl).document.execCommand('insertBrOnReturn', false, false)

    debug('connect:run')

    observer.observe(rootEl, {
      childList: true,
      characterData: true,
      attributes: true,
      subtree: true,
      characterDataOldValue: true,
    })

    state.rootEl = rootEl
  }

  function disconnect() {
    debug('disconnect')
    observer.disconnect()
    state.rootEl = null
  }

  function applyCommandStream(commands) {
    if (commands.length > 0) {
      debug('stream says:', commands.length, commands.slice())

      editor.withoutNormalizing(() => {
        for (const command of commands) {
          editor[command.type](...makeSlateCommandArgs(editor, command))
        }
      })
    }
  }

  function reverseMutation(mutation) {
    if (mutation.type === 'childList') {
      for (const added of mutation.addedNodes) {
        added.remove()
      }

      for (const removed of mutation.removedNodes) {
        mutation.target.insertBefore(removed, mutation.nextSibling)
      }
    } else if (mutation.type === 'characterData') {
      mutation.target.textContent = mutation.oldValue
    }
  }

  function withoutListeningToMutations(f) {
    disconnect()
    f()
    connect()
  }

  function reverseMutations(mutations) {
    debug('reverseMutations', mutations)

    if (mutations.length > 0) {
      withoutListeningToMutations(() => {
        mutations.reverse().forEach(mutation => reverseMutation(mutation))
      })
    }
  }

  function pushCommandsToStream(commands, mutations = []) {
    if (state.isComposing) {
      state.compositionCommands.push(
        ...commandsFromMutations(mutations, state.rootEl)
      )

      state.compositionMutations.push(...mutations)
    } else {
      reverseMutations(mutations)
      applyCommandStream([...commands])
    }
  }

  function flushBufferToStream() {
    const mutations = state.compositionMutations
    const commands = state.compositionCommands

    state.compositionMutations = []
    state.compositionCommands = []

    const selectCommands = processSelect()
    reverseMutations(mutations)
    applyCommandStream([...commands, ...selectCommands])
  }

  /**
   * Handle MutationObserver flush
   *
   * @param {MutationList} mutations
   */

  function flush(mutations) {
    debug('flush:mutations', mutations)
    const commands = commandsFromMutations(mutations, state.rootEl)
    pushCommandsToStream(commands, mutations)
  }

  function onCompositionEnd() {
    debug('compositionEnd')
    flushBufferToStream()
    state.isComposing = false
  }

  function onCompositionStart() {
    debug('compositionStart')
    state.isComposing = true
  }

  /**
   * Handle `onSelect` event
   *
   * Save the selection after a `requestAnimationFrame`
   *
   * - If we're not in the middle of flushing mutations
   * - and cancel save if a mutation runs before the `requestAnimationFrame`
   */

  function onSelect(event) {
    const range = processSelect(event)

    if (state.compositionMutations.length === 0) {
      debug('onSelect:apply', range)
      applyCommandStream(processSelect())
    } else if (state.isComposing) {
      debug('onSelect:save', range)
      state.compositionCommands.push(...processSelect())
    }
  }

  return {
    clearDiff: () => {},
    connect,
    disconnect,
    onCompositionEnd,
    onCompositionStart,
    onSelect,
    hasPendingCompositionDiff: () => {
      return state.compositionMutations.length !== 0
    },
  }
}

export default MutationManager

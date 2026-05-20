import { Extension } from '@tiptap/core'
import type { Editor as CoreEditor, Range } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'

export interface SearchAndReplaceStorage {
  searchTerm: string
  replaceTerm: string
  results: Range[]
  lastSearchTerm: string
  selectedResult: number
  lastSelectedResult: number
  caseSensitive: boolean
  lastCaseSensitiveState: boolean
}

type EditorStorage = { searchAndReplace: SearchAndReplaceStorage }

const getStorage = (editor: CoreEditor): SearchAndReplaceStorage =>
  (editor.storage as unknown as EditorStorage).searchAndReplace

declare module '@tiptap/core' {
  interface Commands<TReturnType> {
    search: {
      /**
       * @description Set search term in extension.
       */
      setSearchTerm: (searchTerm: string) => TReturnType
      /**
       * @description Set replace term in extension.
       */
      setReplaceTerm: (replaceTerm: string) => TReturnType
      /**
       * @description Replace first instance of search result with given replace term.
       */
      replace: () => TReturnType
      /**
       * @description Replace all instances of search result with given replace term.
       */
      replaceAll: () => TReturnType
      /**
       * @description Select the next search result.
       */
      selectNextResult: () => TReturnType
      /**
       * @description Select the previous search result.
       */
      selectPreviousResult: () => TReturnType
      /**
       * @description Set case sensitivity in extension.
       */
      setCaseSensitive: (caseSensitive: boolean) => ReturnType
    }
  }
}

interface TextNodeWithPosition {
  text: string
  pos: number
}

const getRegex = (
  searchString: string,
  disableRegex: boolean,
  caseSensitive: boolean,
): RegExp => {
  const escapedString = disableRegex
    ? searchString.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    : searchString
  return new RegExp(escapedString, caseSensitive ? 'gu' : 'gui')
}

interface ProcessedSearches {
  decorationsToReturn: DecorationSet
  results: Range[]
}

function processSearches(
  doc: PMNode,
  searchTerm: RegExp,
  selectedResultIndex: number,
  searchResultClass: string,
  selectedResultClass: string,
): ProcessedSearches {
  const decorations: Decoration[] = []
  const results: Range[] = []
  const textNodesWithPosition: TextNodeWithPosition[] = []

  doc.descendants((node, pos) => {
    if (node.isText) {
      textNodesWithPosition.push({ text: node.text || '', pos })
    }
  })

  for (const { text, pos } of textNodesWithPosition) {
    const matches = Array.from(text.matchAll(searchTerm)).filter(
      ([matchText]) => matchText.trim(),
    )

    for (const match of matches) {
      results.push({
        from: pos + match.index,
        to: pos + match.index + match[0].length,
      })
    }
  }

  for (const [i, { from, to }] of results.entries()) {
    decorations.push(
      Decoration.inline(from, to, {
        class:
          selectedResultIndex === i ? selectedResultClass : searchResultClass,
      }),
    )
  }

  return {
    decorationsToReturn: DecorationSet.create(doc, decorations),
    results,
  }
}

const replace = (
  replaceTerm: string,
  results: Range[],
  { state, dispatch }: any,
) => {
  if (!results.length) {
    return
  }

  const { from, to } = results[0]

  if (dispatch) {
    dispatch(state.tr.insertText(replaceTerm, from, to))
  }
}

const rebaseNextResult = (
  replaceTerm: string,
  index: number,
  lastOffset: number,
  results: Range[],
): [number, Range[]] | null => {
  const nextIndex = index + 1

  if (nextIndex >= results.length) {
    return null
  }

  if (index >= results.length) {
    return null
  }

  const { from: currentFrom, to: currentTo } = results[index]

  const offset = currentTo - currentFrom - replaceTerm.length + lastOffset

  const { from, to } = results[nextIndex]

  results[nextIndex] = {
    to: to - offset,
    from: from - offset,
  }

  return [offset, results]
}

const replaceAll = (
  replaceTerm: string,
  results: Range[],
  { tr, dispatch }: { tr: any; dispatch: any },
) => {
  if (!results.length) {
    return
  }

  let offset = 0

  for (let i = 0; i < results.length; i++) {
    const { from, to } = results[i]
    tr.insertText(replaceTerm, from, to)
    const rebaseResponse = rebaseNextResult(replaceTerm, i, offset, results)

    if (rebaseResponse) {
      offset = rebaseResponse[0]
    }
  }

  dispatch(tr)
}

const selectNext = (editor: CoreEditor) => {
  const storage = getStorage(editor)
  const { results } = storage

  if (!results.length) {
    return
  }

  if (storage.selectedResult >= results.length - 1) {
    storage.selectedResult = 0
  } else {
    storage.selectedResult += 1
  }

  const { from } = results[storage.selectedResult]

  // @ts-expect-error - domAtPos returns a node not typed with scrollIntoView
  editor.view
    .domAtPos(from)
    .node.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const selectPrevious = (editor: CoreEditor) => {
  const storage = getStorage(editor)
  const { results } = storage

  if (!results.length) {
    return
  }

  if (storage.selectedResult <= 0) {
    storage.selectedResult = results.length - 1
  } else {
    storage.selectedResult -= 1
  }

  const { from } = results[storage.selectedResult]

  // @ts-expect-error - domAtPos returns a node not typed with scrollIntoView
  editor.view
    .domAtPos(from)
    .node.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

export const searchAndReplacePluginKey = new PluginKey('searchAndReplacePlugin')

export interface SearchAndReplaceOptions {
  searchResultClass: string
  selectedResultClass: string
  disableRegex: boolean
}

export const SearchAndReplace = Extension.create<
  SearchAndReplaceOptions,
  SearchAndReplaceStorage
>({
  name: 'searchAndReplace',

  addOptions() {
    return {
      searchResultClass: ' bg-yellow-200',
      selectedResultClass: 'bg-yellow-500',
      disableRegex: true,
    }
  },

  addStorage() {
    return {
      searchTerm: '',
      replaceTerm: '',
      results: [],
      lastSearchTerm: '',
      selectedResult: 0,
      lastSelectedResult: 0,
      caseSensitive: false,
      lastCaseSensitiveState: false,
    }
  },

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string) =>
        ({ editor }) => {
          getStorage(editor).searchTerm = searchTerm

          return false
        },
      setReplaceTerm:
        (replaceTerm: string) =>
        ({ editor }) => {
          getStorage(editor).replaceTerm = replaceTerm

          return false
        },
      replace:
        () =>
        ({ editor, state, dispatch }) => {
          const { replaceTerm, results } = getStorage(editor)

          replace(replaceTerm, results, { state, dispatch })

          return false
        },
      replaceAll:
        () =>
        ({ editor, tr, dispatch }) => {
          const { replaceTerm, results } = getStorage(editor)

          replaceAll(replaceTerm, results, { tr, dispatch })

          return false
        },
      selectNextResult:
        () =>
        ({ editor }) => {
          selectNext(editor)

          return false
        },
      selectPreviousResult:
        () =>
        ({ editor }) => {
          selectPrevious(editor)

          return false
        },
      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ editor }) => {
          getStorage(editor).caseSensitive = caseSensitive

          return false
        },
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const { searchResultClass, selectedResultClass, disableRegex } =
      this.options

    const setLastSearchTerm = (t: string) => {
      getStorage(editor).lastSearchTerm = t
    }

    const setLastSelectedResult = (r: number) => {
      getStorage(editor).lastSelectedResult = r
    }

    const setLastCaseSensitiveState = (s: boolean) => {
      getStorage(editor).lastCaseSensitiveState = s
    }

    return [
      new Plugin({
        key: searchAndReplacePluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply({ doc, docChanged }, oldState) {
            const {
              searchTerm,
              selectedResult,
              lastSearchTerm,
              lastSelectedResult,
              caseSensitive,
              lastCaseSensitiveState,
            } = getStorage(editor)

            if (
              !docChanged &&
              lastSearchTerm === searchTerm &&
              selectedResult === lastSelectedResult &&
              lastCaseSensitiveState === caseSensitive
            ) {
              return oldState
            }

            setLastSearchTerm(searchTerm)
            setLastSelectedResult(selectedResult)
            setLastCaseSensitiveState(caseSensitive)

            if (!searchTerm) {
              getStorage(editor).selectedResult = 0
              getStorage(editor).results = []
              return DecorationSet.empty
            }

            const { decorationsToReturn, results } = processSearches(
              doc,
              getRegex(searchTerm, disableRegex, caseSensitive),
              selectedResult,
              searchResultClass,
              selectedResultClass,
            )

            getStorage(editor).results = results

            if (selectedResult > results.length) {
              getStorage(editor).selectedResult = 1
              editor.commands.selectPreviousResult()
            }

            return decorationsToReturn
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})

export default SearchAndReplace

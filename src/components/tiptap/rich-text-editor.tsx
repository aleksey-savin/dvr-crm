'use client'
import './tiptap.css'
import { cn } from '@/lib/utils'
import { useRef, useEffect, memo } from 'react'
import { ImageExtension } from '@/components/tiptap/extensions/image'
import { ImagePlaceholder } from '@/components/tiptap/extensions/image-placeholder'
import SearchAndReplace from '@/components/tiptap/extensions/search-and-replace'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { EditorContent, type Extension, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TipTapFloatingMenu } from '@/components/tiptap/extensions/floating-menu'
import { FloatingToolbar } from '@/components/tiptap/extensions/floating-toolbar'
import { EditorToolbar } from './toolbars/editor-toolbar'
import Placeholder from '@tiptap/extension-placeholder'

// Defined outside component so the array reference is stable across renders.
// Tiptap v3's StarterKit already bundles Link + Underline, so we disable
// them there to avoid the "Duplicate extension names" warning.
const extensions = [
  StarterKit.configure({
    orderedList: {
      HTMLAttributes: {
        class: 'list-decimal',
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: 'list-disc',
      },
    },
    heading: {
      levels: [1, 2, 3, 4],
    },
    // Disabled here because we add our own instances below
    link: false,
    underline: false,
  }),
  Placeholder.configure({
    emptyNodeClass: 'is-editor-empty',
    placeholder: ({ node }) => {
      switch (node.type.name) {
        case 'heading':
          return `Heading ${node.attrs.level}`
        case 'detailsSummary':
          return 'Section title'
        case 'codeBlock':
          return ''
        default:
          return "Write, type '/' for commands"
      }
    },
    includeChildren: false,
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  TextStyle,
  Subscript,
  Superscript,
  Underline,
  Link,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  ImageExtension,
  ImagePlaceholder,
  SearchAndReplace,
  Typography,
]

// Stable object reference — prevents Tiptap's compareOptions() from seeing a
// change on every render, which would otherwise call editor.setOptions() +
// view.setProps() + view.updateState() on every keystroke.
const editorProps = {
  attributes: {
    class: 'max-w-full focus:outline-none',
  },
}

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

function RichTextEditorInner({
  value,
  onChange,
  className,
}: RichTextEditorProps) {
  // Keep a ref to the initial value so the editor is never re-initialised
  // when the parent form re-renders with a new `value` on every keystroke.
  const initialValueRef = useRef(value ?? '')

  // Always call the latest onChange without recreating the editor.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: extensions as Extension[],
    content: initialValueRef.current,
    editorProps,
    onUpdate: ({ editor }) => {
      onChangeRef.current?.(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div
      className={cn('relative flex flex-col w-full border bg-card', className)}
    >
      <EditorToolbar editor={editor} />
      <FloatingToolbar editor={editor} />
      <TipTapFloatingMenu editor={editor} />
      <EditorContent
        editor={editor}
        className="flex-1 min-h-0 overflow-y-auto w-full cursor-text"
      />
    </div>
  )
}

// memo() with a custom comparator: skip re-renders that are caused solely by
// the parent form passing a new `value` prop on every keystroke. The editor
// owns its content internally; `className` and the component identity are the
// only things that should ever trigger a real re-render from outside.
export const RichTextEditor = memo(RichTextEditorInner, (prev, next) => {
  return prev.className === next.className
})

// Keep the demo export as an alias for backward compatibility
export { RichTextEditor as RichTextEditorDemo }

'use client'

import { MDXEditorMethods, MDXEditorProps } from '@mdxeditor/editor'
import dynamic from 'next/dynamic'
import { forwardRef } from 'react'

const BaseEditor = dynamic(() => import('./InitEditor'), {
  // Make sure we turn SSR off
  ssr: false
})

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
export const Editor = forwardRef<MDXEditorMethods, MDXEditorProps>((props, ref) => <BaseEditor {...props} editorRef={ref} />)

// TS complains without the following line
Editor.displayName = 'Editor'

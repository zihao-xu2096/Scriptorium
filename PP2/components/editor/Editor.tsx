import React, { useCallback, useContext, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Editable, withReact, useSlate, Slate, RenderElementProps, RenderLeafProps, ReactEditor, useFocused } from 'slate-react'
import {
  BaseEditor,
  Editor,
  Transforms,
  createEditor,
  Descendant,
  Element as SlateElement,
  BaseRange,
  Range,
  Node,
} from 'slate'
import { withHistory, HistoryEditor } from 'slate-history'
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import CodeIcon from '@mui/icons-material/Code';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import InsertLinkIcon from '@mui/icons-material/InsertLink';

import Link from 'next/link'
import { LinkModal } from './LinkModal'
import { Button } from './Button'
import { Post } from '@prisma/client';
import { UserContext } from '@/context/UserContext'

interface Options {
  [key: string]: string;
}

export interface PostWithDisplay extends Post {
  tags: {
      label: string;
  }[],
  createdBy: {
    firstName: string;
    lastName: string;
  }, votes: {
    id: number;
    userId: number;
    voteType: string;
    postId: number;
  }[];
}

const HOTKEYS: Options = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
  'mod+l': 'insert'
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

type CustomText = { 
  text: string; 
  bold?: true, 
  code?: true, 
  italic?: true, 
  underline?: true 
}

type H1Element = {
  type: 'heading-one',
  children: Descendant[],
  align?: 'left' | 'center' | 'right' | 'justify'
}

type H2Element = {
  type: 'heading-two',
  children: Descendant[],
  align?: 'left' | 'center' | 'right' | 'justify'
}

type DefaultElement = {
  type: 'paragraph',
  children: Descendant[],
  align?: 'left' | 'center' | 'right' | 'justify'
}

type QuoteElement = {
  type: 'block-quote',
  children: Descendant[],
  align?: 'left' | 'center' | 'right' | 'justify'
}

type NumberedListElement = {
  type: 'numbered-list',
  children: Descendant[],
  align?: 'left' | 'center' | 'right' | 'justify'
}

type BulletedListElement = {
  type: 'bulleted-list',
  children: Descendant[],
  align?: 'left' | 'center' | 'right' | 'justify'
}

type ListItemElement = {
  type: 'list-item',
  children: Descendant[],
  align?: 'left' | 'center' | 'right' | 'justify'
}

type TemplateInfo = {
  title: string;
  id: number;
  url: string;
}

type LinkElement = { 
  type: 'link';
  align?: string;
  template: TemplateInfo | null;
  children: CustomText[]
}

export type CustomElement = QuoteElement | NumberedListElement | BulletedListElement | ListItemElement | H1Element | H2Element | LinkElement | DefaultElement

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
    Range: BaseRange & {
      [key: string]: unknown
    }
  }
}

interface EditorProps {
  readOnly: boolean
  initialValue: Descendant[]
  post: PostWithDisplay
}

export function RichTextEditor ({readOnly, initialValue, post }: EditorProps) {
  const { user, loading, login } = useContext(UserContext);
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
  const [editor] = useState(() => withInlines(withHistory(withReact(createEditor()))));
  const [content, setContent] = useState<Descendant[]>([{type:"paragraph",align:"center",children:[{text:""}]}]);
  const [templates, setTemplates] = useState<number[]>([]);

  const ref = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const insertLink = (editor: Editor) => {
    return (template: TemplateInfo) => {
      const link: LinkElement  = {
        type: 'link',
        template,
        children: [{ text: '' }],
      }
      setTemplates(templates.concat(template.id))
      Transforms.insertNodes(editor, link);
      Transforms.move(editor);
    }
  }

  /*
  useEffect(() => {
    if (target && chars.length > 0) {
      const el = ref.current
      if (!el) {
        return;
      }
      const domRange = ReactEditor.toDOMRange(editor, target)
      const rect = domRange.getBoundingClientRect()
      el.style.top = `${rect.top + window.scrollY + 24}px`
      el.style.left = `${rect.left + window.scrollX}px`
    }
  }, [chars.length, editor, index, search, target, isLinkSearchActive])*/

  return (
    <>
    <Slate 
    editor={editor} 
    initialValue={initialValue}

    onValueChange={(value) => {
      const isAstChange = editor.operations.some(
      op => 'set_selection' !== op.type
      )
      editor.operations.forEach((operation) => {
        if (operation.type === 'remove_node') {
          const { node } = operation;

          if (isElement(node) && isLinkElement(node) && node.template) {
            console.log(node)
            const indexOf = templates.findIndex(val => val === node.template?.id)
            console.log(templates)
            console.log(indexOf)
            if (indexOf >= 0) {
              const copy = [...templates];
              copy.splice(indexOf, 1);
              console.log(copy)
              setTemplates(copy);
            }
          }
        }
      });
      if (isAstChange) {
          const content = value;
          setContent(content);
        }
      }
    }
    >
      {!readOnly && <div>
        <LinkButton showDialog={() => dialogRef.current?.showModal()} />
        <MarkButton format="bold" icon="format_bold"/>
        <MarkButton format="italic" icon="format_italic" />
        <MarkButton format="underline" icon="format_underlined" />
        <MarkButton format="code" icon="code" />
        <BlockButton format="heading-one" icon="looks_one"/>
        <BlockButton format="heading-two" icon="looks_two" />
        <BlockButton format="block-quote" icon="format_quote" />
        <BlockButton format="numbered-list" icon="format_list_numbered"/>
        <BlockButton format="bulleted-list" icon="format_list_bulleted"/>
        <BlockButton format="left" icon="format_align_left"/>
        <BlockButton format="center" icon="format_align_center" />
        <BlockButton format="right" icon="format_align_right" />
        <BlockButton format="justify" icon="format_align_justify" />
      </div>}
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some rich text…"

        className="w-full min-h-80 bg-gray-900 my-4 rounded-md"
        spellCheck
        autoFocus
        readOnly={readOnly}
        onKeyDown={(event) => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event as any)) {
              const mark = HOTKEYS[hotkey];
              if (isMarkFormat(mark)) {
                toggleMark(editor, mark);
              }
            }
          }
        }}
        onBlur={
          (e) => {
            if (ref.current?.contains(e.relatedTarget)) {
              return;
            }
          }
        }
      />
    </Slate>
    { !readOnly &&
    <button onClick={async () => {
      
      const res = await fetch(`/api/blog-posts/${post.id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("accessToken")}`,
          'Content-Type': "application/json"
        },
        body: JSON.stringify({
          content: JSON.stringify(content),
          templates,

        })
      })

      const message = await res.json();
      console.log(message)
    }}>submit</button>}
    <LinkModal onInsert={insertLink(editor)} ref={dialogRef} />
    </>
  )
}

const toggleBlock = (editor: Editor, format: 'left' | 'center' | 'right' | 'justify' |
  'block-quote' | 'numbered-list' | 'bulleted-list' | 'heading-one' | 'heading-two') => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  )
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  })
  let newProperties: Partial<SlateElement>
  if (isTextAlignFormat(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    }
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    }
  }
  Transforms.setNodes<SlateElement>(editor, newProperties)

  if (!isActive && isListType(format)) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
}

const toggleMark = (editor: Editor, format: "bold" | "code" | "italic" | "underline") => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor: Editor, format:  'left' | 'center' | 'right' | 'justify' | 'block-quote' | 'numbered-list' | 'bulleted-list' | 'heading-one' | 'heading-two' | 'left' | 'center' | 'right' | 'justify' , blockType: "type" | "align") => {
  const { selection } = editor;
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  )

  return !!match
}

function isMarkActive (editor: Editor, format: "bold" | "code" | "italic" | "underline" ) {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

function Element ({ attributes, children, element }: RenderElementProps) {
  const textAlign = element.align;
  switch (element.type) {
    case 'link':
      return (
        <span className="inline-block" contentEditable="false" {...attributes}>
            {
              element.template ? 
              <>
              <Link data-template={element.template?.id} href={element.template?.url || ""}>
                {element.template?.title}
                {children}
              </Link> 
              </>
              : 
              <>
                {"[dead-node]"}
                {children}
              </>
            }
        </span>
      )
    case 'block-quote':
      return (
        <blockquote className={
          textAlign === "center" ? "text-center" : 
          textAlign === "justify" ? "text-justify" :
          textAlign === "left" ? "text-left" :
          textAlign === "right" ? "text-right" : "text-left"} {...attributes}>
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul className={
          textAlign === "center" ? "text-center" : 
          textAlign === "justify" ? "text-justify" :
          textAlign === "left" ? "text-left" :
          textAlign === "right" ? "text-right" : "text-left" + " list-disc"} {...attributes}>
          {children}
        </ul>
      )
    case 'heading-one':
      return (
        <h1 className={
          textAlign === "center" ? "text-center" : 
          textAlign === "justify" ? "text-justify" :
          textAlign === "left" ? "text-left" :
          textAlign === "right" ? "text-right" : "text-left"} {...attributes}>
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 className={
          textAlign === "center" ? "text-center" : 
          textAlign === "justify" ? "text-justify" :
          textAlign === "left" ? "text-left" :
          textAlign === "right" ? "text-right" : "text-left"} {...attributes}>
          {children}
        </h2>
      )
    case 'list-item':
      return (
        <li className={
          textAlign === "center" ? "text-center" : 
          textAlign === "justify" ? "text-justify" :
          textAlign === "left" ? "text-left" :
          textAlign === "right" ? "text-right" : "text-left"} {...attributes}>
          {children}
        </li>
      )
    case 'numbered-list':
      return (
        <ol className={
          textAlign === "center" ? "text-center" : 
          textAlign === "justify" ? "text-justify" :
          textAlign === "left" ? "text-left" :
          textAlign === "right" ? "text-right" : "text-left" + " list-decimal"} {...attributes}>
          {children}
        </ol>
      )
    default:
      return (
        <p className={
          textAlign === "center" ? "text-center" : 
          textAlign === "justify" ? "text-justify" :
          textAlign === "left" ? "text-left" :
          textAlign === "right" ? "text-right" : "text-left"} {...attributes}>
          {children}
        </p>
      )
  }
}

function Leaf({ attributes, children, leaf }: RenderLeafProps) {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

type BlockButtonParams = {
  format: 'block-quote' | 'numbered-list' | 'bulleted-list' | 'heading-one' | 'heading-two' |
  'left' | 'center' | 'right' | 'justify' ,
  icon: string,
} 

function BlockButton({ format, icon }: BlockButtonParams) {
  const editor = useSlate()
  return (
    <Button
      active={isBlockActive(
        editor,
        format,
        TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
      )}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        toggleBlock(editor, format)
      }}
    >
      {icon === "looks_one" ? < LooksOneIcon /> : 
      icon === "looks_two" ? < LooksTwoIcon /> : 
      icon === "format_quote" ? < FormatQuoteIcon /> : 
      icon === "format_list_numbered" ? <FormatListNumberedIcon/> :
      icon === "format_list_bulleted" ? <FormatListBulletedIcon/> :
      icon === "format_align_left" ? <FormatAlignLeftIcon/> :
      icon === "format_align_right" ? <FormatAlignRightIcon/> :
      icon === "format_align_center" ? <FormatAlignCenterIcon/> :
      <FormatAlignJustifyIcon/>}
    </Button>
  )
}

type MarkButtonParams = {
  format:  "bold" | "code" | "italic" | "underline",
  icon: string
}

function MarkButton ({ format, icon }: MarkButtonParams) {
  const editor = useSlate()
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        toggleMark(editor, format)
      }}
    >
      {icon === "format_bold" ? <FormatBoldIcon /> : icon === "format_italic" ? <FormatItalicIcon /> :icon === "format_underlined" ? <FormatUnderlinedIcon /> : <CodeIcon /> }
        
    </Button>
  )
}

type LinkButtonParams = {
  showDialog: Function
}


function LinkButton({showDialog}: LinkButtonParams) {
    return (
      <Button
        active={false}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={() => {
          showDialog();
        }}
      >
        < InsertLinkIcon />
      </Button>
    )
  }

// type guards for validating valid formats
function isTextAlignFormat(format: string): format is 'left' | 'center' | 'right' | 'justify' {
  return TEXT_ALIGN_TYPES.includes(format);
}

function isBlockType(format: string): format is 'block-quote' | 'numbered-list' | 'bulleted-list' | 'heading-one' | 'heading-two' {
  return ['block-quote', 'numbered-list', 'bulleted-list', 'heading-one', 'heading-two'].includes(format);
}

function isListType(format: string): format is 'numbered-list' | 'bulleted-list' {
  return LIST_TYPES.includes(format);
}

function isMarkFormat(format: string): format is 'bold' | 'italic' | 'underline' | 'code' {
  return ['bold', 'italic', 'underline', 'code'].includes(format);
}

const withInlines = (editor: Editor) => {
  const { isInline, isVoid, markableVoid } = editor

  editor.isInline = element => {
    return element.type === 'link' ? true : isInline(element)
  }

  editor.isVoid = element => {
    return element.type === 'link' ? true : isVoid(element)
  }

  editor.markableVoid = element => {
    return element.type === 'link' || markableVoid(element)
  }

  return editor
}


function isElement(val: Node): val is CustomElement{
  return  val.hasOwnProperty('type')
}

function isLinkElement(val: CustomElement): val is LinkElement {
  return val.type === "link"
}
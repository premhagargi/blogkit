'use client';

import type { PlateEditor } from 'platejs/react';

import { insertCallout } from '@platejs/callout';
import { insertCodeBlock, toggleCodeBlock } from '@platejs/code-block';
import { insertDate } from '@platejs/date';
import { insertColumnGroup, toggleColumnGroup } from '@platejs/layout';
import { triggerFloatingLink } from '@platejs/link/react';
import { insertEquation, insertInlineEquation } from '@platejs/math';
import {
  insertAudioPlaceholder,
  insertFilePlaceholder,
  insertImagePlaceholder,
  insertMedia,
  insertVideoPlaceholder,
} from '@platejs/media';
import { getGlobalEmbedDialog } from '@/components/platejs/ui/embed-dialog-context';
import { getGlobalCTADialog } from '@/components/platejs/ui/cta-dialog-context';
import type { CTAData } from '@/components/platejs/ui/cta-dialog';
import { getGlobalFAQDialog } from '@/components/platejs/ui/faq-dialog-context';
import type { FAQData } from '@/components/platejs/ui/faq-dialog';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import { TablePlugin } from '@platejs/table/react';
import { insertToc } from '@platejs/toc';
import {
  type NodeEntry,
  type Path,
  type TElement,
  KEYS,
  PathApi,
} from 'platejs';

const ACTION_THREE_COLUMNS = 'action_three_columns';

const insertList = (editor: PlateEditor, type: string) => {
  editor.tf.insertNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    { select: true }
  );
};

const insertBlockMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.listTodo]: insertList,
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
  [ACTION_THREE_COLUMNS]: (editor) =>
    insertColumnGroup(editor, { columns: 3, select: true }),
  [KEYS.audio]: (editor) => insertAudioPlaceholder(editor, { select: true }),
  [KEYS.callout]: (editor) => insertCallout(editor, { select: true }),
  [KEYS.codeBlock]: (editor) => insertCodeBlock(editor, { select: true }),
  [KEYS.equation]: (editor) => insertEquation(editor, { select: true }),
  [KEYS.file]: (editor) => insertFilePlaceholder(editor, { select: true }),
  [KEYS.img]: (editor) => insertImagePlaceholder(editor, { select: true }),
  [KEYS.mediaEmbed]: (editor) => {
    const openDialog = getGlobalEmbedDialog();
    if (openDialog) {
      // Use custom dialog
      openDialog((url: string) => {
        editor.tf.insertNodes(
          {
            children: [{ text: '' }],
            type: KEYS.mediaEmbed,
            url,
          },
          { select: true }
        );
      });
    } else {
      // Fallback to default behavior (which may use alert)
      insertMedia(editor, {
        select: true,
        type: KEYS.mediaEmbed,
      });
    }
  },
  [KEYS.table]: (editor) =>
    editor.getTransforms(TablePlugin).insert.table({}, { select: true }),
  [KEYS.toc]: (editor) => insertToc(editor, { select: true }),
  [KEYS.video]: (editor) => insertVideoPlaceholder(editor, { select: true }),
  button: (editor) => {
    editor.tf.insertNodes(
      editor.api.create.block({
        type: 'button',
        children: [{ text: 'Button' }],
      }),
      { select: true }
    );
  },
  cta: (editor) => {
    const openDialog = getGlobalCTADialog();
    if (openDialog) {
      // Use custom dialog
      openDialog((data: CTAData) => {
        editor.tf.insertNodes(
          {
            children: [{ text: '' }],
            type: 'cta',
            ...data,
          },
          { select: true }
        );
      });
    } else {
      // Fallback to basic CTA block
      editor.tf.insertNodes(
        editor.api.create.block({
          type: 'cta',
          heading: '',
        }),
        { select: true }
      );
    }
  },
  faq: (editor) => {
    const openDialog = getGlobalFAQDialog();
    if (openDialog) {
      // Use custom dialog
      openDialog((data: FAQData) => {
        editor.tf.insertNodes(
          {
            children: [{ text: '' }],
            type: 'faq',
            ...data,
          },
          { select: true }
        );
      });
    } else {
      // Fallback to basic FAQ block
      editor.tf.insertNodes(
        editor.api.create.block({
          type: 'faq',
          items: [{ question: '', answer: '' }],
        }),
        { select: true }
      );
    }
  },
};

const insertInlineMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.date]: (editor) => insertDate(editor, { select: true }),
  [KEYS.inlineEquation]: (editor) =>
    insertInlineEquation(editor, '', { select: true }),
  [KEYS.link]: (editor) => triggerFloatingLink(editor, { focused: true }),
};

export const insertBlock = (editor: PlateEditor, type: string) => {
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();

    if (!block) return;
    if (type in insertBlockMap) {
      insertBlockMap[type](editor, type);
    } else {
      editor.tf.insertNodes(editor.api.create.block({ type }), {
        at: PathApi.next(block[1]),
        select: true,
      });
    }
    if (getBlockType(block[0]) !== type) {
      editor.getApi(SuggestionPlugin).suggestion.withoutSuggestions(() => {
        editor.tf.removeNodes({ previousEmptyBlock: true });
      });
    }
  });
};

export const insertInlineElement = (editor: PlateEditor, type: string) => {
  if (insertInlineMap[type]) {
    insertInlineMap[type](editor, type);
  }
};

const setList = (
  editor: PlateEditor,
  type: string,
  entry: NodeEntry<TElement>
) => {
  editor.tf.setNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    {
      at: entry[1],
    }
  );
};

const setBlockMap: Record<
  string,
  (editor: PlateEditor, type: string, entry: NodeEntry<TElement>) => void
> = {
  [KEYS.listTodo]: setList,
  [KEYS.ol]: setList,
  [KEYS.ul]: setList,
  [ACTION_THREE_COLUMNS]: (editor) => toggleColumnGroup(editor, { columns: 3 }),
  [KEYS.codeBlock]: (editor) => toggleCodeBlock(editor),
};

export const setBlockType = (
  editor: PlateEditor,
  type: string,
  { at }: { at?: Path } = {}
) => {
  editor.tf.withoutNormalizing(() => {
    const setEntry = (entry: NodeEntry<TElement>) => {
      const [node, path] = entry;

      if (node[KEYS.listType]) {
        editor.tf.unsetNodes([KEYS.listType, 'indent'], { at: path });
      }
      if (type in setBlockMap) {
        return setBlockMap[type](editor, type, entry);
      }
      if (node.type !== type) {
        editor.tf.setNodes({ type }, { at: path });
      }
    };

    if (at) {
      const entry = editor.api.node<TElement>(at);

      if (entry) {
        setEntry(entry);

        return;
      }
    }

    const entries = editor.api.blocks({ mode: 'lowest' });

    entries.forEach((entry) => setEntry(entry));
  });
};

export const getBlockType = (block: TElement) => {
  if (block[KEYS.listType]) {
    if (block[KEYS.listType] === KEYS.ol) {
      return KEYS.ol;
    } else if (block[KEYS.listType] === KEYS.listTodo) {
      return KEYS.listTodo;
    } else {
      return KEYS.ul;
    }
  }

  return block.type;
};

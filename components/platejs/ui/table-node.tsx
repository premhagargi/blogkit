'use client';

import * as React from 'react';

import type * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { useDraggable, useDropLine } from '@platejs/dnd';
import {
  BlockSelectionPlugin,
  useBlockSelected,
} from '@platejs/selection/react';
import { setCellBackground } from '@platejs/table';
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableProvider,
  useTableBordersDropdownMenuContentState,
  useTableCellElement,
  useTableCellElementResizable,
  useTableElement,
  useTableMergeState,
} from '@platejs/table/react';
import { PopoverAnchor } from '@radix-ui/react-popover';
import { cva } from 'class-variance-authority';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CombineIcon,
  EraserIcon,
  Grid2X2Icon,
  GripVertical,
  PaintBucketIcon,
  SquareSplitHorizontalIcon,
  Trash2Icon,
  XIcon,
  Heading1,
  Columns,
} from 'lucide-react';
import {
  type TElement,
  type TTableCellElement,
  type TTableElement,
  type TTableRowElement,
  KEYS,
  PathApi,
} from 'platejs';
import {
  type PlateElementProps,
  PlateElement,
  useComposedRef,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  usePluginOption,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
  withHOC,
} from 'platejs/react';
import { useElementSelector } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { blockSelectionVariants } from './block-selection';
import {
  ColorDropdownMenuItems,
  DEFAULT_COLORS,
} from './font-color-toolbar-button';
import { ResizeHandle } from './resize-handle';
import {
  BorderAllIcon,
  BorderBottomIcon,
  BorderLeftIcon,
  BorderNoneIcon,
  BorderRightIcon,
  BorderTopIcon,
} from './table-icons';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuGroup,
} from './toolbar';
export const TableElement = withHOC(
  TableProvider,
  function TableElement({
    children,
    ...props
  }: PlateElementProps<TTableElement>) {
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(
      BlockSelectionPlugin,
      'isSelectionAreaVisible'
    );
    const hasControls = !readOnly && !isSelectionAreaVisible;
    const {
      isSelectingCell,
      marginLeft,
      props: tableProps,
    } = useTableElement();

    const isSelectingTable = useBlockSelected(props.element.id as string);

    const content = (
      <PlateElement
        {...props}
        className={cn(
          'overflow-x-auto py-5',
          hasControls && '-ml-2 *:data-[slot=block-selection]:left-2'
        )}
        style={{ paddingLeft: marginLeft }}
      >
        <div className="group/table relative w-fit">
          <table
            className={cn(
              'mr-0 ml-px table h-px table-fixed border-collapse',
              isSelectingCell && 'selection:bg-transparent'
            )}
            {...tableProps}
          >
            <tbody className="min-w-full">{children}</tbody>
          </table>

          {isSelectingTable && (
            <div className={blockSelectionVariants()} contentEditable={false} />
          )}
        </div>
      </PlateElement>
    );

    if (readOnly) {
      return content;
    }

    return <TableFloatingToolbar>{content}</TableFloatingToolbar>;
  }
);

function TableFloatingToolbar({
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const editor = useEditorRef();
  const { tf } = useEditorPlugin(TablePlugin);
  const selected = useSelected();
  const element = useElement<TTableElement>();
  const { props: buttonProps } = useRemoveNodeButton({ element });
  const collapsedInside = useEditorSelector(
    (editor) => selected && editor.api.isCollapsed(),
    [selected]
  );
  const isFocusedLast = useFocusedLast();

  const { canMerge, canSplit } = useTableMergeState();

  // Get plugin keys for header toggle
  const headerType = React.useMemo(
    () => editor.getType(TableCellHeaderPlugin.key),
    [editor]
  );
  const cellType = React.useMemo(
    () => editor.getType(TableCellPlugin.key),
    [editor]
  );

  // Get current cell path to determine row/column position
  const currentCellPath = useEditorSelector(
    (editor) => {
      if (!collapsedInside) return null;
      const selection = editor.selection;
      if (!selection) return null;
      
      // Find the cell containing the selection
      const cellEntry = editor.api.above({
        at: selection.anchor.path,
        match: (n) => n.type === headerType || n.type === cellType,
      });
      
      if (!cellEntry) return null;
      return editor.api.findPath(cellEntry[0]);
    },
    [collapsedInside, headerType, cellType]
  );

  // Check if we're in the first row
  const isFirstRow = React.useMemo(() => {
    if (!currentCellPath || currentCellPath.length < 2) return false;
    // The row index is the second-to-last element in the path
    // Path format: [..., tableIndex, rowIndex, cellIndex]
    const rowIndex = currentCellPath[currentCellPath.length - 2];
    return typeof rowIndex === 'number' && rowIndex === 0;
  }, [currentCellPath]);

  // Check if we're in the first column
  const isFirstColumn = React.useMemo(() => {
    if (!currentCellPath || currentCellPath.length < 1) return false;
    // The cell index is the last element in the path
    // Path format: [..., tableIndex, rowIndex, cellIndex]
    const cellIndex = currentCellPath[currentCellPath.length - 1];
    return typeof cellIndex === 'number' && cellIndex === 0;
  }, [currentCellPath]);

  // Check if first row is a header row
  const isHeaderRow = React.useMemo(() => {
    if (!isFirstRow) return false;
    
    // Use element.children directly since element is the table
    const rows = element.children as TTableRowElement[];
    if (rows.length === 0) return false;

    const firstRow = rows[0];
    const cells = firstRow.children as TTableCellElement[];
    // Check if ALL cells in the first row are header cells
    return cells.length > 0 && cells.every((cell) => cell.type === headerType);
  }, [element, isFirstRow, headerType]);

  // Check if first column is a header column
  const isHeaderColumn = React.useMemo(() => {
    // Use element.children directly since element is the table
    const rows = element.children as TTableRowElement[];
    if (rows.length === 0) return false;

    // Check if ALL rows have header cells in the first column
    return rows.every((row) => {
      const cells = row.children as TTableCellElement[];
      return cells.length > 0 && cells[0]?.type === headerType;
    });
  }, [element, headerType]);

  // Toggle header row
  const toggleHeaderRow = React.useCallback(() => {
    if (!isFirstRow) return;

    const tablePath = editor.api.findPath(element);
    if (!tablePath) return;

    // Use element.children directly since element is the table
    const rows = element.children as TTableRowElement[];
    if (rows.length === 0) return;

    const firstRow = rows[0];
    const rowPath = [...tablePath, 0];
    const cells = firstRow.children as TTableCellElement[];
    const newType = isHeaderRow ? cellType : headerType;

    editor.tf.withoutNormalizing(() => {
      cells.forEach((cell, index) => {
        const cellPath = [...rowPath, index];
        const currentCell = editor.api.node({ at: cellPath });
        if (currentCell && currentCell[0]) {
          const cellElement = currentCell[0] as TTableCellElement;
          if (cellElement.type !== newType) {
            editor.tf.setNodes({ type: newType }, { at: cellPath });
          }
        }
      });
    });

    editor.tf.focus();
  }, [editor, element, isFirstRow, isHeaderRow, headerType, cellType]);

  // Toggle header column
  const toggleHeaderColumn = React.useCallback(() => {
    const tablePath = editor.api.findPath(element);
    if (!tablePath) return;

    // Use element.children directly since element is the table
    const rows = element.children as TTableRowElement[];
    const newType = isHeaderColumn ? cellType : headerType;

    editor.tf.withoutNormalizing(() => {
      rows.forEach((row, rowIndex) => {
        const rowPath = [...tablePath, rowIndex];
        const rowElement = row as TTableRowElement;
        const cells = rowElement.children as TTableCellElement[];
        if (cells.length > 0) {
          const cellPath = [...rowPath, 0];
          const currentCell = editor.api.node({ at: cellPath });
          if (currentCell && currentCell[0]) {
            const cellElement = currentCell[0] as TTableCellElement;
            if (cellElement.type !== newType) {
              editor.tf.setNodes({ type: newType }, { at: cellPath });
            }
          }
        }
      });
    });

    editor.tf.focus();
  }, [editor, element, isHeaderColumn, headerType, cellType]);

  return (
    <Popover
      open={isFocusedLast && (canMerge || canSplit || collapsedInside)}
      modal={false}
    >
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        asChild
        onOpenAutoFocus={(e) => e.preventDefault()}
        contentEditable={false}
        {...props}
      >
        <Toolbar
          className="scrollbar-hide flex w-auto max-w-[80vw] flex-row overflow-x-auto rounded-md border bg-popover p-1 shadow-md print:hidden"
          contentEditable={false}
        >
          <ToolbarGroup>
            <ColorDropdownMenu tooltip="Background color">
              <PaintBucketIcon />
            </ColorDropdownMenu>
            {canMerge && (
              <ToolbarButton
                onClick={() => tf.table.merge()}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Merge cells"
              >
                <CombineIcon />
              </ToolbarButton>
            )}
            {canSplit && (
              <ToolbarButton
                onClick={() => tf.table.split()}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Split cell"
              >
                <SquareSplitHorizontalIcon />
              </ToolbarButton>
            )}

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <ToolbarButton tooltip="Cell borders">
                  <Grid2X2Icon />
                </ToolbarButton>
              </DropdownMenuTrigger>

              <DropdownMenuPortal>
                <TableBordersDropdownMenuContent />
              </DropdownMenuPortal>
            </DropdownMenu>

            {isFirstRow && collapsedInside && (
              <ToolbarButton
                onClick={(e) => {
                  e.preventDefault();
                  toggleHeaderRow();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip={isHeaderRow ? 'Remove Header Row' : 'Make Header Row'}
                pressed={isHeaderRow}
              >
                <Heading1 />
              </ToolbarButton>
            )}
            {isFirstColumn && collapsedInside && (
              <ToolbarButton
                onClick={(e) => {
                  e.preventDefault();
                  toggleHeaderColumn();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip={isHeaderColumn ? 'Remove Header Column' : 'Make Header Column'}
                pressed={isHeaderColumn}
              >
                <Columns />
              </ToolbarButton>
            )}

            {collapsedInside && (
              <ToolbarGroup>
                <ToolbarButton tooltip="Delete table" {...buttonProps}>
                  <Trash2Icon />
                </ToolbarButton>
              </ToolbarGroup>
            )}
          </ToolbarGroup>

          {collapsedInside && (
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => {
                  tf.insert.tableRow({ before: true });
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert row before"
              >
                <ArrowUp />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  tf.insert.tableRow();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert row after"
              >
                <ArrowDown />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  tf.remove.tableRow();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Delete row"
              >
                <XIcon />
              </ToolbarButton>
            </ToolbarGroup>
          )}

          {collapsedInside && (
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => {
                  tf.insert.tableColumn({ before: true });
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert column before"
              >
                <ArrowLeft />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  tf.insert.tableColumn();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert column after"
              >
                <ArrowRight />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  tf.remove.tableColumn();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Delete column"
              >
                <XIcon />
              </ToolbarButton>
            </ToolbarGroup>
          )}
        </Toolbar>
      </PopoverContent>
    </Popover>
  );
}

function TableBordersDropdownMenuContent(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Content>
) {
  const editor = useEditorRef();
  const {
    getOnSelectTableBorder,
    hasBottomBorder,
    hasLeftBorder,
    hasNoBorders,
    hasOuterBorders,
    hasRightBorder,
    hasTopBorder,
  } = useTableBordersDropdownMenuContentState();

  return (
    <DropdownMenuContent
      className="min-w-[220px]"
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        editor.tf.focus();
      }}
      align="start"
      side="right"
      sideOffset={0}
      {...props}
    >
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasTopBorder}
          onCheckedChange={getOnSelectTableBorder('top')}
        >
          <BorderTopIcon />
          <div>Top Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasRightBorder}
          onCheckedChange={getOnSelectTableBorder('right')}
        >
          <BorderRightIcon />
          <div>Right Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasBottomBorder}
          onCheckedChange={getOnSelectTableBorder('bottom')}
        >
          <BorderBottomIcon />
          <div>Bottom Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasLeftBorder}
          onCheckedChange={getOnSelectTableBorder('left')}
        >
          <BorderLeftIcon />
          <div>Left Border</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>

      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasNoBorders}
          onCheckedChange={getOnSelectTableBorder('none')}
        >
          <BorderNoneIcon />
          <div>No Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasOuterBorders}
          onCheckedChange={getOnSelectTableBorder('outer')}
        >
          <BorderAllIcon />
          <div>Outside Borders</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

function ColorDropdownMenu({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) {
  const [open, setOpen] = React.useState(false);

  const editor = useEditorRef();
  const selectedCells = usePluginOption(TablePlugin, 'selectedCells');

  const onUpdateColor = React.useCallback(
    (color: string) => {
      setOpen(false);
      setCellBackground(editor, { color, selectedCells: selectedCells ?? [] });
    },
    [selectedCells, editor]
  );

  const onClearColor = React.useCallback(() => {
    setOpen(false);
    setCellBackground(editor, {
      color: null,
      selectedCells: selectedCells ?? [],
    });
  }, [selectedCells, editor]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip={tooltip}>{children}</ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <ToolbarMenuGroup label="Colors">
          <ColorDropdownMenuItems
            className="px-2"
            colors={DEFAULT_COLORS}
            updateColor={onUpdateColor}
          />
        </ToolbarMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem className="p-2" onClick={onClearColor}>
            <EraserIcon />
            <span>Clear</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableRowElement(props: PlateElementProps<TTableRowElement>) {
  const { element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const editor = useEditorRef();
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );
  const hasControls = !readOnly && !isSelectionAreaVisible;

  const { isDragging, previewRef, handleRef } = useDraggable({
    element,
    type: element.type,
    canDropNode: ({ dragEntry, dropEntry }) =>
      PathApi.equals(
        PathApi.parent(dragEntry[1]),
        PathApi.parent(dropEntry[1])
      ),
    onDropHandler: (_, { dragItem }) => {
      const dragElement = (dragItem as { element: TElement }).element;

      if (dragElement) {
        editor.tf.select(dragElement);
      }
    },
  });

  return (
    <PlateElement
      {...props}
      ref={useComposedRef(props.ref, previewRef)}
      as="tr"
      className={cn('group/row', isDragging && 'opacity-50')}
      attributes={{
        ...props.attributes,
        'data-selected': selected ? 'true' : undefined,
      }}
    >
      {hasControls && (
        <td className="w-2 select-none" contentEditable={false}>
          <RowDragHandle dragRef={handleRef} />
          <RowDropLine />
        </td>
      )}

      {props.children}
    </PlateElement>
  );
}

function RowDragHandle({ dragRef }: { dragRef: React.Ref<any> }) {
  const editor = useEditorRef();
  const element = useElement<TTableRowElement>();
  const { api } = useEditorPlugin(TablePlugin);
  const [open, setOpen] = React.useState(false);

  // Get row index to check if it's the first row
  const rowIndex = React.useMemo(() => {
    const rowPath = editor.api.findPath(element);
    if (!rowPath || rowPath.length === 0) return -1;

    const tablePath = PathApi.parent(rowPath);
    if (!tablePath) return -1;

    // The row index is the last element in the rowPath
    // rowPath format: [..., tableIndex, rowIndex]
    // So rowIndex = rowPath[rowPath.length - 1]
    const index = rowPath[rowPath.length - 1];
    return typeof index === 'number' ? index : -1;
  }, [editor, element]);

  const isFirstRow = rowIndex === 0;

  // Get plugin keys
  const headerType = React.useMemo(
    () => editor.getType(TableCellHeaderPlugin.key),
    [editor]
  );
  const cellType = React.useMemo(
    () => editor.getType(TableCellPlugin.key),
    [editor]
  );

  // Check if first row is a header row
  const isHeaderRow = React.useMemo(() => {
    if (!isFirstRow) return false;
    const rowPath = editor.api.findPath(element);
    if (!rowPath) return false;

    const row = editor.api.node({ at: rowPath });
    if (!row) return false;

    const rowElement = row[0] as TTableRowElement;
    const cells = rowElement.children as TTableCellElement[];
    if (cells.length === 0) return false;

    return cells.some((cell) => cell.type === headerType);
  }, [editor, element, isFirstRow, headerType]);

  // Check if first column is a header column
  const isHeaderColumn = React.useMemo(() => {
    const rowPath = editor.api.findPath(element);
    if (!rowPath) return false;

    const tablePath = PathApi.parent(rowPath);
    if (!tablePath) return false;

    const table = editor.api.node({ at: tablePath });
    if (!table) return false;

    const tableElement = table[0] as TTableElement;
    const rows = tableElement.children as TTableRowElement[];
    if (rows.length === 0) return false;

    return rows.some((row) => {
      const cells = row.children as TTableCellElement[];
      return cells.length > 0 && cells[0]?.type === headerType;
    });
  }, [editor, element, headerType]);

  const toggleHeaderRow = React.useCallback(() => {
    if (!isFirstRow) return;

    const rowPath = editor.api.findPath(element);
    if (!rowPath) return;

    const row = editor.api.node({ at: rowPath });
    if (!row) return;

    const rowElement = row[0] as TTableRowElement;
    const cells = rowElement.children as TTableCellElement[];
    const newType = isHeaderRow ? cellType : headerType;

    // Batch all cell type changes
    editor.tf.withoutNormalizing(() => {
      cells.forEach((cell, index) => {
        const cellPath = [...rowPath, index];
        const currentCell = editor.api.node({ at: cellPath });
        if (currentCell && currentCell[0]) {
          const cellElement = currentCell[0] as TTableCellElement;
          // Only change if the type is different
          if (cellElement.type !== newType) {
            editor.tf.setNodes({ type: newType }, { at: cellPath });
          }
        }
      });
    });

    setOpen(false);
    editor.tf.focus();
  }, [editor, element, isFirstRow, isHeaderRow, headerType, cellType]);

  const toggleHeaderColumn = React.useCallback(() => {
    const rowPath = editor.api.findPath(element);
    if (!rowPath) return;

    const tablePath = PathApi.parent(rowPath);
    if (!tablePath) return;

    const table = editor.api.node({ at: tablePath });
    if (!table) return;

    const tableElement = table[0] as TTableElement;
    const rows = tableElement.children as TTableRowElement[];
    const newType = isHeaderColumn ? cellType : headerType;

    // Batch all cell type changes
    editor.tf.withoutNormalizing(() => {
      rows.forEach((row, rowIndex) => {
        const rowPath = [...tablePath, rowIndex];
        const rowElement = row as TTableRowElement;
        const cells = rowElement.children as TTableCellElement[];
        if (cells.length > 0) {
          const cellPath = [...rowPath, 0];
          const currentCell = editor.api.node({ at: cellPath });
          if (currentCell && currentCell[0]) {
            const cellElement = currentCell[0] as TTableCellElement;
            // Only change if the type is different
            if (cellElement.type !== newType) {
              editor.tf.setNodes({ type: newType }, { at: cellPath });
            }
          }
        }
      });
    });

    setOpen(false);
    editor.tf.focus();
  }, [editor, element, isHeaderColumn, headerType, cellType]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={dragRef}
          variant="outline"
          className={cn(
            'absolute top-1/2 left-0 z-51 h-6 w-4 -translate-y-1/2 p-0 focus-visible:ring-0 focus-visible:ring-offset-0',
            'cursor-grab active:cursor-grabbing',
            'opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-has-data-[resizing="true"]/row:opacity-0'
          )}
          onClick={(e) => {
            // Open menu on click, but allow drag on drag
            e.stopPropagation();
          }}
        >
          <GripVertical className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="right"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
      >
        <DropdownMenuGroup>
          {isFirstRow && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  toggleHeaderRow();
                }}
              >
                <Heading1 className="mr-2 h-4 w-4" />
                <span>{isHeaderRow ? 'Remove Header Row' : 'Make Header Row'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  toggleHeaderColumn();
                }}
              >
                <Columns className="mr-2 h-4 w-4" />
                <span>
                  {isHeaderColumn ? 'Remove Header Column' : 'Make Header Column'}
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowDropLine() {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <div
      className={cn(
        'absolute inset-x-0 left-2 z-50 h-0.5 bg-brand/50',
        dropLine === 'top' ? '-top-px' : '-bottom-px'
      )}
    />
  );
}

export function TableCellElement({
  isHeader,
  ...props
}: PlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const editor = useEditorRef();
  const { api } = useEditorPlugin(TablePlugin);
  const readOnly = useReadOnly();
  const element = props.element;

  const tableId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.table,
  });
  const rowId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.tr,
  });
  const isSelectingTable = useBlockSelected(tableId);
  const isSelectingRow = useBlockSelected(rowId) || isSelectingTable;
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );

  const { borders, colIndex, colSpan, minHeight, rowIndex, selected, width } =
    useTableCellElement();

  // Check if this cell is in a header row (first row with header cells)
  const isInHeaderRow = React.useMemo(() => {
    if (rowIndex !== 0) return false;
    
    const headerType = editor.getType(TableCellHeaderPlugin.key);
    const rowPath = editor.api.findPath(element);
    if (!rowPath || rowPath.length < 2) return false;
    
    const tablePath = PathApi.parent(PathApi.parent(rowPath));
    if (!tablePath) return false;
    
    const table = editor.api.node({ at: tablePath });
    if (!table) return false;
    
    const tableElement = table[0] as TTableElement;
    const rows = tableElement.children as TTableRowElement[];
    if (rows.length === 0) return false;
    
    const firstRow = rows[0];
    const cells = firstRow.children as TTableCellElement[];
    return cells.some((cell) => cell.type === headerType);
  }, [editor, element, rowIndex]);

  const { bottomProps, hiddenLeft, leftProps, rightProps } =
    useTableCellElementResizable({
      colIndex,
      colSpan,
      rowIndex,
    });

  return (
    <PlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'h-full overflow-visible border-none bg-background p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left *:m-0',
        // Apply bold and header styling to all cells in header row or if this is a header cell
        (isInHeaderRow || isHeader) && 'font-semibold bg-muted/50',
        'before:size-full',
        selected && 'before:z-10 before:bg-brand/5',
        "before:absolute before:box-border before:content-[''] before:select-none",
        borders.bottom?.size && `before:border-b before:border-b-border`,
        borders.right?.size && `before:border-r before:border-r-border`,
        borders.left?.size && `before:border-l before:border-l-border`,
        borders.top?.size && `before:border-t before:border-t-border`
      )}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: width || 240,
          minWidth: width || 120,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element),
      }}
    >
      <div
        className="relative z-20 box-border h-full px-3 py-2"
        style={{ minHeight }}
      >
        {props.children}
      </div>

      {!isSelectionAreaVisible && (
        <div
          className="group absolute top-0 size-full select-none"
          contentEditable={false}
          suppressContentEditableWarning={true}
        >
          {!readOnly && (
            <>
              <ResizeHandle
                {...rightProps}
                className="-top-2 -right-1 h-[calc(100%+8px)] w-2"
                data-col={colIndex}
              />
              <ResizeHandle {...bottomProps} className="-bottom-1 h-2" />
              {!hiddenLeft && (
                <ResizeHandle
                  {...leftProps}
                  className="top-0 -left-1 w-2"
                  data-resizer-left={colIndex === 0 ? 'true' : undefined}
                />
              )}

              <div
                className={cn(
                  'absolute top-0 z-30 hidden h-full w-1 bg-ring',
                  'right-[-1.5px]',
                  columnResizeVariants({ colIndex: colIndex as any })
                )}
              />
              {colIndex === 0 && (
                <div
                  className={cn(
                    'absolute top-0 z-30 h-full w-1 bg-ring',
                    'left-[-1.5px]',
                    'hidden animate-in fade-in group-has-[[data-resizer-left]:hover]/table:block group-has-[[data-resizer-left][data-resizing="true"]]/table:block'
                  )}
                />
              )}
            </>
          )}
        </div>
      )}

      {isSelectingRow && (
        <div className={blockSelectionVariants()} contentEditable={false} />
      )}
    </PlateElement>
  );
}

export function TableCellHeaderElement(
  props: React.ComponentProps<typeof TableCellElement>
) {
  return <TableCellElement {...props} isHeader />;
}

const columnResizeVariants = cva('hidden animate-in fade-in', {
  variants: {
    colIndex: {
      0: 'group-has-[[data-col="0"]:hover]/table:block group-has-[[data-col="0"][data-resizing="true"]]/table:block',
      1: 'group-has-[[data-col="1"]:hover]/table:block group-has-[[data-col="1"][data-resizing="true"]]/table:block',
      2: 'group-has-[[data-col="2"]:hover]/table:block group-has-[[data-col="2"][data-resizing="true"]]/table:block',
      3: 'group-has-[[data-col="3"]:hover]/table:block group-has-[[data-col="3"][data-resizing="true"]]/table:block',
      4: 'group-has-[[data-col="4"]:hover]/table:block group-has-[[data-col="4"][data-resizing="true"]]/table:block',
      5: 'group-has-[[data-col="5"]:hover]/table:block group-has-[[data-col="5"][data-resizing="true"]]/table:block',
      6: 'group-has-[[data-col="6"]:hover]/table:block group-has-[[data-col="6"][data-resizing="true"]]/table:block',
      7: 'group-has-[[data-col="7"]:hover]/table:block group-has-[[data-col="7"][data-resizing="true"]]/table:block',
      8: 'group-has-[[data-col="8"]:hover]/table:block group-has-[[data-col="8"][data-resizing="true"]]/table:block',
      9: 'group-has-[[data-col="9"]:hover]/table:block group-has-[[data-col="9"][data-resizing="true"]]/table:block',
      10: 'group-has-[[data-col="10"]:hover]/table:block group-has-[[data-col="10"][data-resizing="true"]]/table:block',
    },
  },
});

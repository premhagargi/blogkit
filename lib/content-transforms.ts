// // Content transformation utilities for PlateJS content
// // import { createSlateEditor } from 'platejs/core';
// // import { serializeHtml } from 'platejs/html';

// // You'll need to import your EditorKit - adjust path as needed
// import { EditorKit } from '@/components/platejs/editor/editor-kit';

// // PlateJS node to text extraction
// export function plateJSToText(nodes: any[]): string {
//   const extractText = (nodes: any[]): string => {
//     return nodes
//       .map((node) => {
//         if (typeof node === 'string') return node;
//         if (node.text) return node.text;
//         if (node.children) return extractText(node.children);
//         return '';
//       })
//       .join(' ');
//   };

//   return extractText(nodes);
// }

// // PlateJS to HTML conversion using official PlateJS serializer
// export async function plateJSToHTML(nodes: any[]): Promise<string> {
//   try {
//     // Create a server-side editor instance
//     const editor = createSlateEditor({
//       plugins: EditorKit,
//     });

//     // Use PlateJS built-in HTML serialization
//     const html = await serializeHtml(editor, {
//       value: nodes,
//       stripClassNames: true, // Remove internal CSS classes
//       stripDataAttributes: true, // Remove internal data attributes
//     });

//     return html;
//   } catch (error) {
//     console.error('Error serializing to HTML:', error);
//     // Fallback to basic serialization
//     return plateJSToHTMLFallback(nodes);
//   }
// }

// // Fallback HTML serialization
// function plateJSToHTMLFallback(nodes: any[]): string {
//   return nodes.map((node) => nodeToHTML(node)).join('');
// }

// function nodeToHTML(node: any): string {
//   if (node.text) {
//     let text = escapeHtml(node.text);

//     // Apply text formatting
//     if (node.bold) text = `<strong>${text}</strong>`;
//     if (node.italic) text = `<em>${text}</em>`;
//     if (node.underline) text = `<u>${text}</u>`;
//     if (node.strikethrough) text = `<del>${text}</del>`;
//     if (node.code) text = `<code>${text}</code>`;
//     if (node.highlight) text = `<mark>${text}</mark>`;

//     return text;
//   }

//   const children = node.children ? node.children.map(nodeToHTML).join('') : '';

//   switch (node.type) {
//     case 'p':
//       return `<p${getAlignStyle(node)}>${children}</p>`;
//     case 'h1':
//       return `<h1${getAlignStyle(node)}>${children}</h1>`;
//     case 'h2':
//       return `<h2${getAlignStyle(node)}>${children}</h2>`;
//     case 'h3':
//       return `<h3${getAlignStyle(node)}>${children}</h3>`;
//     case 'h4':
//       return `<h4${getAlignStyle(node)}>${children}</h4>`;
//     case 'h5':
//       return `<h5${getAlignStyle(node)}>${children}</h5>`;
//     case 'h6':
//       return `<h6${getAlignStyle(node)}>${children}</h6>`;
//     case 'blockquote':
//       return `<blockquote${getAlignStyle(node)}>${children}</blockquote>`;
//     case 'ul':
//       return `<ul>${children}</ul>`;
//     case 'ol':
//       return `<ol>${children}</ol>`;
//     case 'li':
//       return `<li>${children}</li>`;
//     case 'code_block':
//       const language = node.lang || node.language || '';
//       return `<pre><code${
//         language ? ` class="language-${language}"` : ''
//       }>${escapeHtml(children)}</code></pre>`;
//     case 'hr':
//       return '<hr />';
//     case 'br':
//       return '<br />';
//     case 'a':
//     case 'link':
//       return `<a href="${escapeHtml(node.url || node.href || '')}"${
//         node.target ? ` target="${node.target}"` : ''
//       }>${children}</a>`;
//     case 'img':
//     case 'image':
//       return `<img src="${escapeHtml(
//         node.url || node.src || ''
//       )}" alt="${escapeHtml(node.alt || '')}" />`;
//     case 'table':
//       return `<table>${children}</table>`;
//     case 'tr':
//       return `<tr>${children}</tr>`;
//     case 'td':
//       return `<td>${children}</td>`;
//     case 'th':
//       return `<th>${children}</th>`;
//     case 'callout':
//       return `<div class="callout ${node.variant || 'info'}">${children}</div>`;
//     default:
//       return children;
//   }
// }

// function getAlignStyle(node: any): string {
//   if (node.align && node.align !== 'left') {
//     return ` style="text-align: ${node.align};"`;
//   }
//   return '';
// }

// function escapeHtml(text: string): string {
//   const map: { [key: string]: string } = {
//     '&': '&amp;',
//     '<': '&lt;',
//     '>': '&gt;',
//     '"': '&quot;',
//     "'": '&#039;',
//   };
//   return text.replace(/[&<>"']/g, (m) => map[m]);
// }

// // PlateJS to MDX conversion
// export function plateJSToMDX(nodes: any[]): string {
//   return nodes.map((node) => nodeToMDX(node)).join('\n\n');
// }

// function nodeToMDX(node: any): string {
//   if (node.text) {
//     let text = node.text;

//     // Apply text formatting
//     if (node.bold) text = `**${text}**`;
//     if (node.italic) text = `*${text}*`;
//     if (node.underline) text = `<u>${text}</u>`;
//     if (node.strikethrough) text = `~~${text}~~`;
//     if (node.code) text = `\`${text}\``;
//     if (node.highlight) text = `<mark>${text}</mark>`;

//     return text;
//   }

//   const children = node.children ? node.children.map(nodeToMDX).join('') : '';

//   switch (node.type) {
//     case 'p':
//       return children || '';
//     case 'h1':
//       return `# ${children}`;
//     case 'h2':
//       return `## ${children}`;
//     case 'h3':
//       return `### ${children}`;
//     case 'h4':
//       return `#### ${children}`;
//     case 'h5':
//       return `##### ${children}`;
//     case 'h6':
//       return `###### ${children}`;
//     case 'blockquote':
//       return `> ${children}`;
//     case 'ul':
//       return children;
//     case 'ol':
//       return children;
//     case 'li':
//       return `- ${children}`;
//     case 'code_block':
//       const language = node.lang || node.language || '';
//       return `\`\`\`${language}\n${children}\n\`\`\``;
//     case 'hr':
//       return '---';
//     case 'br':
//       return '  \n'; // Two spaces + newline for line break in markdown
//     case 'a':
//     case 'link':
//       return `[${children}](${node.url || node.href || ''})`;
//     case 'img':
//     case 'image':
//       return `![${node.alt || ''}](${node.url || node.src || ''})`;
//     case 'callout':
//       return `<Callout variant="${
//         node.variant || 'info'
//       }">\n${children}\n</Callout>`;
//     case 'table':
//       // Basic table conversion - you might want to enhance this
//       return children;
//     case 'tr':
//       return `${children}\n`;
//     case 'td':
//     case 'th':
//       return `| ${children} `;
//     default:
//       return children;
//   }
// }

// // Enhanced read time calculation
// export function calculateReadTime(content: any[]): number {
//   const text = plateJSToText(content);
//   const words = text
//     .trim()
//     .split(/\s+/)
//     .filter((word) => word.length > 0).length;
//   return Math.max(1, Math.ceil(words / 200)); // 200 words per minute
// }

// // Content format converter
// export async function convertContent(
//   content: any[],
//   formats: ('html' | 'mdx')[] = ['html', 'mdx']
// ) {
//   const result: any = {
//     json: content,
//     readTime: calculateReadTime(content),
//   };

//   if (formats.includes('html')) {
//     result.html = await plateJSToHTML(content);
//   }

//   if (formats.includes('mdx')) {
//     result.mdx = plateJSToMDX(content);
//   }

//   return result;
// }

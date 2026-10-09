/**
 * Finds Markdown that turns prose into something its writer did not mean.
 *
 * The long texts of this site are prose: none holds computer code, and no
 * list is numbered from anywhere but 1. Two habits of typing break that
 * without a word of warning. A paragraph indented with spaces is drawn as a
 * box of code that runs off the side of the screen, and a paragraph that
 * opens with a year ("1922. gadā …") becomes item 1922 of a numbered list.
 */
export interface Trap {
  /** Line in the file, counted from 1. */
  line: number;
  problem: 'indented' | 'fenced' | 'numbered';
  /** The start of the line, to find it by. */
  text: string;
}

export const trapAdvice: Record<Trap['problem'], string> = {
  indented: 'begins with four or more spaces, so it is drawn as a box of code; remove the spaces',
  fenced: 'opens a block of code; the long texts have none',
  numbered:
    'begins with a number and a full stop, so it becomes a numbered list; put a backslash before the full stop ("1922\\. gadā")',
};

export function findTraps(markdown: string): Trap[] {
  const lines = markdown.split('\n');
  const traps: Trap[] = [];
  const note = (index: number, problem: Trap['problem']) =>
    traps.push({ line: index + 1, problem, text: lines[index]!.trim().slice(0, 60) });

  // The facts at the head of a file, between two lines of dashes, are not Markdown.
  const head = lines[0] === '---' ? lines.indexOf('---', 1) : -1;

  let afterBlank = true;
  let fence: string | undefined;
  /** The number of the last item while a numbered list runs; 0 inside a bulleted one. */
  let listNumber: number | undefined;

  for (let index = head + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (fence) {
      if (line.trim().startsWith(fence)) fence = undefined;
      continue;
    }
    if (!line.trim()) {
      afterBlank = true;
      continue;
    }

    const opensFence = /^ {0,3}(```|~~~)/.exec(line);
    const item = /^ {0,3}(\d{1,9})[.)](?: |$)/.exec(line);
    if (opensFence) {
      note(index, 'fenced');
      fence = opensFence[1];
    } else if (item) {
      const number = Number(item[1]);
      if (listNumber === undefined || listNumber === 0) {
        // Only "1." may interrupt a paragraph; any number may open a list after a blank line.
        if (afterBlank || number === 1) {
          if (number !== 1) note(index, 'numbered');
          listNumber = number;
        }
      } else {
        // A paragraph that opens with a year right after a list is swallowed as its next item.
        if (number !== listNumber + 1) note(index, 'numbered');
        listNumber = number;
      }
    } else if (/^ {0,3}[-+*] /.test(line)) {
      listNumber ??= 0;
    } else if (afterBlank) {
      const inList = listNumber !== undefined;
      // Inside a list an indented line carries an item on; anywhere else it is code.
      if (/^(?: {4,}|\t)/.test(line) && !inList) note(index, 'indented');
      if (!/^(?: {2,}|\t)/.test(line)) listNumber = undefined;
    }
    afterBlank = false;
  }
  return traps;
}

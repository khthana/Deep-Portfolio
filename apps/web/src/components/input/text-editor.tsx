import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension, type JSONContent } from "@tiptap/core";
import { useEffect } from "react";

// const NBSP_TAB = "\u00A0\u00A0\u00A0\u00A0";

// export const TabIndent = Extension.create({
//   name: "tabIndent",
//   addKeyboardShortcuts() {
//     return {
//       Tab: () => {
//         this.editor?.chain().focus().insertContent(NBSP_TAB).run();
//         return true;
//       },
//       // ลด indent
//       "Shift-Tab": () => {
//         const editor = this.editor;
//         if (!editor) return true;

//         const { state } = editor;
//         const { $from } = state.selection;
//         const paraStart = $from.before();
//         const cursorPos = $from.pos;
//         const textBefore = state.doc.textBetween(paraStart, cursorPos);

//         if (textBefore.endsWith(NBSP_TAB)) {
//           editor.commands.command(({ tr }) => {
//             tr.delete(cursorPos - NBSP_TAB.length, cursorPos);
//             return true;
//           });
//         }
//         return true;
//       },
//     };
//   },
// });

const TAB_CHAR = "\u00A0\u00A0\u00A0\u00A0";

const TabHandler = Extension.create({
  name: "tabHandler",
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // Sinks a list item / inserts a tab character
        editor
          .chain()
          .sinkListItem("listItem")
          .command(({ tr }) => {
            tr.insertText(TAB_CHAR);
            return true;
          })
          .run();
        // Prevent default behavior (losing focus)
        return true;
      },
    };
  },
});

type Props = {
  value?: any;
  //   onChange?: any;
  handleOnChange: (value: JSONContent | null) => void;
  name?: string;
  error?: boolean;
};

const TextEditor = ({
  value = null,
  handleOnChange,
  error = false,
  name,
}: Props) => {
  const editor = useEditor({
    extensions: [StarterKit, TabHandler],
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      isEditorEmpty(json) ? handleOnChange(null) : handleOnChange(json);
    },
    editorProps: {
      attributes: {
        // todo : update state when have error
        class: `h-64 overflow-y-auto p-2 border rounded-lg ease-in-out duration-300 hover:border-secondary-blue active:border-secondary-blue focus:outline-none focus:border-secondary-blue ${
          error ? "border-red-500" : "border-light-grey"
        }`,
      },
    },
  });

  const isEditorEmpty = (json: JSONContent) => {
    if (!json || !json.content) return true;

    return json.content.every((node: JSONContent) => {
      if (
        node.type === "paragraph" &&
        (!node.content || node.content.length === 0)
      ) {
        return true;
      }
      return false;
    });
  };

  useEffect(() => {
    if (editor && value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return <EditorContent editor={editor} />;
};

export default TextEditor;

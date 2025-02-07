// components/RichTextEditor/RichTextEditor.jsx
import React, { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";
import Quill from "quill/core";
import Toolbar from "quill/modules/toolbar";
import Snow from "quill/themes/snow";
import Bold from "quill/formats/bold";
import Italic from "quill/formats/italic";
import Header from "quill/formats/header";

Quill.register({
  "modules/toolbar": Toolbar,
  "themes/snow": Snow,
  "formats/bold": Bold,
  "formats/italic": Italic,
  "formats/header": Header,
});

const RichTextEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    console.log("Initializing Quill editor");
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
      });
      quillRef.current.on("text-change", () => {
        const editorContent = quillRef.current.root.innerHTML;
        console.log("Editor content changed:", editorContent);
        onChange(editorContent);
      });
    }

    return () => {
      if (quillRef.current) {
        quillRef.current.off("text-change");
      }
    };
  }, [onChange]);

  useEffect(() => {
    console.log("Setting editor content:", value);
    if (quillRef.current) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  return <div ref={editorRef} id="editor" />;
};

export default RichTextEditor;

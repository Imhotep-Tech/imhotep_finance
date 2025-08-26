import React from "react";

const CodeEditor = ({ value, onChange, language = "html" }) => {
  return (
    <textarea
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      rows={18}
      style={{
        width: "100%",
        minHeight: "300px",
        background: "#18181b",
        color: "#f3f4f6",
        fontFamily: "Fira Mono, Menlo, Monaco, 'Courier New', monospace",
        fontSize: "15px",
        borderRadius: "0.5rem",
        border: "1px solid #d1d5db",
        padding: "1rem",
        outline: "none",
        resize: "vertical",
        lineHeight: "1.5",
        boxSizing: "border-box",
        tabSize: 2,
        caretColor: "#f59e42",
        transition: "border-color 0.2s",
      }}
      className="focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
      aria-label="Code editor"
      placeholder={`Paste your ${language.toUpperCase()} code here...`}
    />
  );
};

export default CodeEditor;

"use client";

import { useCallback, useRef } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { X, Save } from "lucide-react";
import { useGameEditorStore } from "@/store/game-editor-store";
import { saveGameFile } from "@/actions/game-actions";
import { useIsMobile } from "@/hooks/use-mobile";
import React from "react";

export default function CodeEditor() {
  const {
    game,
    editor: { activeFileId, openFileIds },
    updateFile,
    setActiveFile,
    closeFile,
  } = useGameEditorStore();

  const monacoRef = useRef<Monaco | null>(null);

  // Get the files that are open in tabs
  const openFiles =
    game?.files.filter((file) => openFileIds.includes(file.id)) || [];
  // Get the active file content
  const activeFile = game?.files.find((file) => file.id === activeFileId);

  const isMobile = useIsMobile();

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;

    // Custom dreamy matrix theme (now: subtle Catppuccin-inspired with green touch)
    monaco.editor.defineTheme('dream-matrix', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'cdd6f4', background: '181825' },
        { token: 'keyword', foreground: 'a6e3a1', fontStyle: 'bold' }, // soft green
        { token: 'string', foreground: 'f5e0dc' },
        { token: 'number', foreground: 'f9e2af' },
        { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
        { token: 'type', foreground: 'b5e8e0' },
        { token: 'function', foreground: '89dceb' },
        { token: 'variable', foreground: 'cdd6f4' },
        { token: 'identifier', foreground: 'cdd6f4' },
        { token: 'delimiter', foreground: '9399b2' },
      ],
      colors: {
        'editor.background': '#181825',
        'editor.foreground': '#cdd6f4',
        'editor.lineHighlightBackground': '#31324466',
        'editorCursor.foreground': '#a6e3a1',
        'editor.selectionBackground': '#a6e3a122',
        'editor.inactiveSelectionBackground': '#a6e3a111',
        'editorIndentGuide.background': '#31324444',
        'editorIndentGuide.activeBackground': '#a6e3a122',
        'editorLineNumber.foreground': '#6c7086bb',
        'editorLineNumber.activeForeground': '#a6e3a1',
        'editorWhitespace.foreground': '#31324444',
        'editorGutter.background': '#181825',
        'editorBracketMatch.background': '#a6e3a122',
        'editorBracketMatch.border': '#a6e3a155',
      },
    });

    monaco.editor.setTheme('dream-matrix');

    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // Add type definitions for React
    fetch("https://unpkg.com/@types/react@18.2.0/index.d.ts")
      .then((response) => response.text())
      .then((types) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          types,
          "file:///node_modules/@types/react/index.d.ts"
        );
      });
  };

  const handleActiveFileChange = useCallback(
    (content: string | undefined) => {
      if (activeFileId && content !== undefined) {
        updateFile(activeFileId, content);
      }
    },
    [activeFileId, updateFile]
  );

  const handleSaveFile = async () => {
    if (activeFileId && activeFile) {
      try {
        await saveGameFile(activeFileId, activeFile.content);
      } catch (error) {
        console.error("Failed to save file:", error);
      }
    }
  };

  // Get language based on file extension
  const getLanguage = (path: string) => {
    const extension = path.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "jsx":
        return "javascript";
      case "tsx":
        return "typescript";
      case "html":
        return "html";
      case "css":
        return "css";
      case "json":
        return "json";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  // Keyboard shortcut for save on desktop
  React.useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, handleSaveFile]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center overflow-x-auto py-1 px-2 gap-0.5 min-h-[36px] border-b border-zinc-800 bg-zinc-900/80">
        {openFiles.map((file) => (
          <div
            key={file.id}
            className={`flex items-center px-2 py-1 min-w-[100px] rounded-md transition-colors ${
              activeFileId === file.id
                ? "bg-zinc-800/70"
                : "hover:bg-zinc-800/40"
            }`}
            onClick={() => setActiveFile(file.id)}
          >
            <span className="text-xs truncate flex-1 text-zinc-300">
              {file.path}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 opacity-50 hover:opacity-100 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden w-full">
        {activeFile ? (
          <div className="h-full w-full flex flex-col">
            <Editor
              height="100%"
              language={getLanguage(activeFile.path)}
              value={activeFile.content}
              onChange={handleActiveFileChange}
              theme="dream-matrix"
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                tabSize: 2,
                automaticLayout: true,
              }}
            />

            <div className="py-1 px-2 flex justify-between items-center border-t border-zinc-800 bg-zinc-900/80">
              <div className="text-xs text-zinc-400">{activeFile.path}</div>

              <Button
                size="sm"
                className="h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium px-3 py-1 shadow-none"
                onClick={handleSaveFile}
              >
                <Save className="h-2.5 w-2.5 mr-1.5 opacity-60" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500">
            {game
              ? "Select a file to edit or create a new one"
              : "No game loaded"}
          </div>
        )}
      </div>
    </div>
  );
}

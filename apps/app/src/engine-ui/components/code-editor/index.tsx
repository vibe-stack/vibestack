"use client"

import { useCallback, useRef } from "react"
import Editor, { Monaco, OnMount } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Plus, X, Save } from "lucide-react"
import { useGameEditorStore } from "@/store/game-editor-store"
import { saveGameFile, createGameFile } from "@/actions/game-actions"

export default function CodeEditor() {
  const {
    game,
    editor: { activeFileId, openFileIds },
    updateFile,
    setActiveFile,
    closeFile,
    addFile,
  } = useGameEditorStore();

  const monacoRef = useRef<Monaco | null>(null);
  
  // Get the files that are open in tabs
  const openFiles = game?.files.filter(file => openFileIds.includes(file.id)) || [];
  // Get the active file content
  const activeFile = game?.files.find(file => file.id === activeFileId);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    
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
    fetch('https://unpkg.com/@types/react@18.2.0/index.d.ts')
      .then(response => response.text())
      .then(types => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          types,
          'file:///node_modules/@types/react/index.d.ts'
        );
      });
  };

  const handleActiveFileChange = useCallback((content: string | undefined) => {
    if (activeFileId && content !== undefined) {
      updateFile(activeFileId, content);
    }
  }, [activeFileId, updateFile]);

  const handleSaveFile = async () => {
    if (activeFileId && activeFile) {
      try {
        await saveGameFile(activeFileId, activeFile.content);
      } catch (error) {
        console.error("Failed to save file:", error);
      }
    }
  };

  const handleCreateFile = async () => {
    if (!game) return;
    
    const fileName = prompt("Enter file name (with extension):");
    if (!fileName) return;
    
    try {
      const fileType = fileName.split('.').pop() || "txt";
      const newFile = await createGameFile(game.id, fileName, fileType, "");
      addFile(newFile);
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  };

  // Get language based on file extension
  const getLanguage = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center overflow-x-auto py-2 px-3 gap-1">
        {openFiles.map((file) => (
          <div
            key={file.id}
            className={`flex items-center px-3 py-1.5 min-w-[120px] rounded-lg transition-colors ${
              activeFileId === file.id ? "bg-zinc-800/70" : "hover:bg-zinc-800/40"
            }`}
            onClick={() => setActiveFile(file.id)}
          >
            <span className="text-sm truncate flex-1">{file.path}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1 opacity-50 hover:opacity-100 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 rounded-full" onClick={handleCreateFile}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden w-full">
        {activeFile ? (
          <div className="h-full w-full flex flex-col">
            <Editor
              height="100%"
              language={getLanguage(activeFile.path)}
              value={activeFile.content}
              onChange={handleActiveFileChange}
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                tabSize: 2,
                automaticLayout: true,
              }}
            />

            <div className="p-3 flex justify-between items-center">
              <div className="text-xs text-zinc-400">{activeFile.path}</div>
              <Button 
                size="sm" 
                className="h-8 rounded-lg bg-violet-700 hover:bg-violet-600"
                onClick={handleSaveFile}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500">
            {game ? "Select a file to edit or create a new one" : "No game loaded"}
          </div>
        )}
      </div>
    </div>
  )
}

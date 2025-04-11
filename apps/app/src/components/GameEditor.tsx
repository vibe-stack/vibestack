import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

interface GameFile {
  id: string;
  path: string;
  type: string;
  content: string;
}

interface Game {
  id: string;
  name: string;
  description?: string;
}

interface GameEditorProps {
  game: Game;
  initialFiles?: GameFile[];
  onSaveFile?: (fileId: string, content: string) => Promise<void>;
  onCreateFile?: (path: string, type: string, content: string) => Promise<void>;
}

export function GameEditor({
  game,
  initialFiles = [],
  onSaveFile,
  onCreateFile
}: GameEditorProps) {
  const [files, setFiles] = useState<GameFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(
    files.length > 0 ? files[0].id : null
  );
  const [editorContent, setEditorContent] = useState<string>("");

  const activeFile = files.find(file => file.id === activeFileId);

  // Load content when active file changes
  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
    } else {
      setEditorContent("");
    }
  }, [activeFile]);

  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    setActiveFileId(fileId);
  };

  // Handle editor content change
  const handleEditorChange = (value: string = "") => {
    setEditorContent(value);
  };

  // Save current file
  const handleSaveFile = async () => {
    if (activeFileId && onSaveFile) {
      await onSaveFile(activeFileId, editorContent);
      
      // Update local file state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === activeFileId 
            ? { ...file, content: editorContent } 
            : file
        )
      );
    }
  };

  // Create a new file
  const handleCreateFile = async () => {
    const fileName = prompt("Enter file name (with extension):");
    if (!fileName) return;
    
    const path = fileName;
    const type = fileName.split('.').pop() || "txt";
    const content = "";
    
    if (onCreateFile) {
      await onCreateFile(path, type, content);
      // We'd typically refresh files from the server after creation
    }
  };

  // Determine language mode based on file extension
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
    <div className="flex h-full w-full">
      {/* File explorer sidebar */}
      <div className="w-64 border-r border-gray-200 p-4 bg-gray-50 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{game.name}</h2>
          <button 
            onClick={handleCreateFile}
            className="p-1 rounded hover:bg-gray-200"
          >
            + New
          </button>
        </div>
        
        <div className="space-y-1">
          {files.map(file => (
            <div 
              key={file.id} 
              className={`p-2 rounded cursor-pointer ${activeFileId === file.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              onClick={() => handleFileSelect(file.id)}
            >
              {file.path}
            </div>
          ))}
          
          {files.length === 0 && (
            <div className="text-gray-500 italic p-2">
              No files yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
      
      {/* Editor area */}
      <div className="flex-1 flex flex-col">
        {/* Editor toolbar */}
        <div className="border-b border-gray-200 p-2 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-700">
            {activeFile ? activeFile.path : "No file selected"}
          </div>
          <button
            onClick={handleSaveFile}
            disabled={!activeFileId}
            className={`px-3 py-1 rounded text-sm ${
              activeFileId
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Save
          </button>
        </div>
        
        {/* Monaco editor */}
        <div className="flex-1">
          {activeFile ? (
            <Editor
              height="100%"
              language={getLanguage(activeFile.path)}
              value={editorContent}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                tabSize: 2,
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a file to edit or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
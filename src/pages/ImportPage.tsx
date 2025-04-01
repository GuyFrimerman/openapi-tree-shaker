import React, { useState, ChangeEvent, DragEvent } from 'react';
import { Upload, Globe } from 'lucide-react';
import { load as yamlLoad } from 'js-yaml';

interface ImportPageProps {
  onSpecLoaded: (spec: any) => void;
}

export function ImportPage({ onSpecLoaded }: ImportPageProps) {
  const [urlInput, setUrlInput] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const parseInput = (content: string, filename?: string): any => {
    try {
      // Try JSON first
      return JSON.parse(content);
    } catch (e) {
      try {
        // If JSON fails, try YAML
        return yamlLoad(content);
      } catch (e2) {
        throw new Error('Failed to parse file as JSON or YAML');
      }
    }
  };

  const validateOpenAPISpec = (json: any): void => {
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid specification format');
    }
    if (!json.paths || typeof json.paths !== 'object') {
      throw new Error('Invalid OpenAPI specification: missing paths object');
    }
    if (Object.keys(json.paths).length === 0) {
      throw new Error('OpenAPI specification contains no paths');
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const text = await file.text();
      const json = parseInput(text, file.name);
      validateOpenAPISpec(json);
      onSpecLoaded(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse OpenAPI specification');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleUrlFetch = async (url: string) => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(parsedUrl.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch specification (HTTP ${response.status})`);
      }

      const text = await response.text();
      const json = parseInput(text);
      validateOpenAPISpec(json);
      onSpecLoaded(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch or parse OpenAPI specification');
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = () => {
    try {
      setLoading(true);
      setError(null);
      const json = parseInput(manualInput);
      validateOpenAPISpec(json);
      onSpecLoaded(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse OpenAPI specification');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    // Handle dropped files
    if (e.dataTransfer.files?.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleFileUpload(file);
      return;
    }

    // Handle dropped text (potentially URLs)
    const text = e.dataTransfer.getData('text');
    if (text) {
      try {
        // Check if it's a URL
        new URL(text);
        await handleUrlFetch(text);
      } catch {
        // If not a URL, try parsing as JSON/YAML
        try {
          const json = parseInput(text);
          validateOpenAPISpec(json);
          onSpecLoaded(json);
        } catch (err) {
          setError('Dropped content is neither a valid URL nor a valid OpenAPI specification');
        }
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Import OpenAPI Specification</h2>
      
      <div className="space-y-6">
        {/* File Upload with Drag & Drop */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <label className="cursor-pointer inline-flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 text-blue-600 hover:text-blue-700">
            <Upload className="w-5 h-5" />
            <span className="text-sm sm:text-base">
              {isDragging ? 'Drop your file here' : 'Upload OpenAPI Specification'}
            </span>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleInputChange}
              className="hidden"
              disabled={loading}
            />
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Drag & drop a file or URL here, or click to select a file (JSON or YAML)
          </p>
        </div>

        {/* URL Input with Drag & Drop */}
        <div className="space-y-2">
          <div
            className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex-1">
              <input
                type="url"
                placeholder="Enter OpenAPI specification URL or drag & drop URL here"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
                disabled={loading}
              />
            </div>
            <button
              onClick={() => handleUrlFetch(urlInput)}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              <Globe className="w-4 h-4" />
              <span>Fetch</span>
            </button>
          </div>
        </div>

        {/* Manual Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Or paste OpenAPI specification
          </label>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste your OpenAPI specification here..."
            className={`w-full h-48 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
            disabled={loading}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
          <div className="flex justify-end">
            <button
              onClick={handleManualInput}
              disabled={loading || !manualInput.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              <span>Parse Specification</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Download, ChevronDown, ChevronRight, ArrowLeft, Copy, Check } from 'lucide-react';
import { dump as yamlDump } from 'js-yaml';
import type { OpenAPISpec, TreeShakeResult } from '../types/openapi';

interface PreviewPageProps {
  spec: OpenAPISpec | null;
  treeShakenResult: TreeShakeResult | null;
  outputFormat: 'json' | 'yaml';
  setOutputFormat: (format: 'json' | 'yaml') => void;
  onBack: () => void;
}

export function PreviewPage({
  treeShakenResult,
  outputFormat,
  setOutputFormat,
  onBack,
}: PreviewPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    paths: false,
    schemas: false,
    parameters: false,
    responses: false,
    requestBodies: false,
  });

  const getFormattedOutput = () => {
    if (!treeShakenResult) return '';
    return outputFormat === 'json'
      ? JSON.stringify(treeShakenResult.spec, null, 2)
      : yamlDump(treeShakenResult.spec, { noRefs: true });
  };

  const handleCopy = async () => {
    const content = getFormattedOutput();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    if (!treeShakenResult) return;

    const content = getFormattedOutput();
    const blob = new Blob([content], { 
      type: outputFormat === 'json' ? 'application/json' : 'application/yaml' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openapi-tree-shaken.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!treeShakenResult) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          Please select at least one endpoint
        </div>
      </div>
    );
  }

  const { summary } = treeShakenResult;

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Preview & Download</h2>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Format:</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as 'json' | 'yaml')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Tree-Shaking Summary</h3>
          <div className="space-y-2">
            {/* Paths */}
            <div className="border-b pb-2">
              <button
                onClick={() => toggleSection('paths')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.paths ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium">
                  Removed Paths ({summary.removedPaths.length})
                </span>
              </button>
              {expandedSections.paths && summary.removedPaths.length > 0 && (
                <div className="mt-2 pl-6 space-y-1">
                  {summary.removedPaths.map(path => (
                    <div key={path} className="font-mono text-sm text-gray-600 break-all">
                      {path}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schemas */}
            <div className="border-b pb-2">
              <button
                onClick={() => toggleSection('schemas')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.schemas ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium">
                  Removed Schemas ({summary.removedSchemas.length})
                </span>
              </button>
              {expandedSections.schemas && summary.removedSchemas.length > 0 && (
                <div className="mt-2 pl-6 space-y-1">
                  {summary.removedSchemas.map(schema => (
                    <div key={schema} className="font-mono text-sm text-gray-600">
                      {schema}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Parameters */}
            <div className="border-b pb-2">
              <button
                onClick={() => toggleSection('parameters')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.parameters ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium">
                  Removed Parameters ({summary.removedParameters.length})
                </span>
              </button>
              {expandedSections.parameters && summary.removedParameters.length > 0 && (
                <div className="mt-2 pl-6 space-y-1">
                  {summary.removedParameters.map(param => (
                    <div key={param} className="font-mono text-sm text-gray-600">
                      {param}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Responses */}
            <div className="border-b pb-2">
              <button
                onClick={() => toggleSection('responses')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.responses ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium">
                  Removed Responses ({summary.removedResponses.length})
                </span>
              </button>
              {expandedSections.responses && summary.removedResponses.length > 0 && (
                <div className="mt-2 pl-6 space-y-1">
                  {summary.removedResponses.map(response => (
                    <div key={response} className="font-mono text-sm text-gray-600">
                      {response}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Request Bodies */}
            <div className="pb-2">
              <button
                onClick={() => toggleSection('requestBodies')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.requestBodies ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium">
                  Removed Request Bodies ({summary.removedRequestBodies.length})
                </span>
              </button>
              {expandedSections.requestBodies && summary.removedRequestBodies.length > 0 && (
                <div className="mt-2 pl-6 space-y-1">
                  {summary.removedRequestBodies.map(body => (
                    <div key={body} className="font-mono text-sm text-gray-600">
                      {body}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg">
          <div className="flex justify-end p-2 border-b border-gray-200">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-800 flex items-center space-x-2 rounded hover:bg-gray-100"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[400px] break-all">
            {getFormattedOutput()}
          </pre>
        </div>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between space-x-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}
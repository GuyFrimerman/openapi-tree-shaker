import React, { useState, useCallback } from 'react';
import { Search, CheckSquare, Square, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Endpoint } from '../App';

interface SelectionPageProps {
  endpoints: Endpoint[];
  setEndpoints: React.Dispatch<React.SetStateAction<Endpoint[]>>;
  onNext: () => void;
  onBack: () => void;
}

export function SelectionPage({ endpoints, setEndpoints, onNext, onBack }: SelectionPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleEndpoint = useCallback(
    (index: number) => {
      setEndpoints(prev =>
        prev.map((endpoint, i) =>
          i === index ? { ...endpoint, selected: !endpoint.selected } : endpoint
        )
      );
    },
    [setEndpoints]
  );

  const filteredEndpoints = endpoints.filter(
    e =>
      e.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allFilteredSelected = filteredEndpoints.every(e => e.selected);
  const noneFilteredSelected = filteredEndpoints.every(e => !e.selected);

  const handleSelectAll = useCallback(() => {
    const filteredIndices = new Set(
      endpoints
        .map((endpoint, index) => ({ endpoint, index }))
        .filter(
          ({ endpoint }) =>
            endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            endpoint.method.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(({ index }) => index)
    );

    setEndpoints(prev =>
      prev.map((endpoint, index) => ({
        ...endpoint,
        selected: filteredIndices.has(index) ? true : endpoint.selected,
      }))
    );
  }, [endpoints, searchTerm, setEndpoints]);

  const handleDeselectAll = useCallback(() => {
    const filteredIndices = new Set(
      endpoints
        .map((endpoint, index) => ({ endpoint, index }))
        .filter(
          ({ endpoint }) =>
            endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            endpoint.method.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(({ index }) => index)
    );

    setEndpoints(prev =>
      prev.map((endpoint, index) => ({
        ...endpoint,
        selected: filteredIndices.has(index) ? false : endpoint.selected,
      }))
    );
  }, [endpoints, searchTerm, setEndpoints]);

  const handleNext = () => {
    const selectedEndpoints = endpoints.filter(e => e.selected);
    if (selectedEndpoints.length === 0) {
      setError('Please select at least one endpoint');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Select Endpoints</h2>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 w-full sm:w-auto sm:flex-1 sm:mr-4">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={handleSelectAll}
            disabled={allFilteredSelected || filteredEndpoints.length === 0}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Filtered ({filteredEndpoints.length})
          </button>
          <button
            onClick={handleDeselectAll}
            disabled={noneFilteredSelected || filteredEndpoints.length === 0}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Deselect Filtered ({filteredEndpoints.length})
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-6 max-h-[calc(100vh-20rem)] overflow-y-auto border border-gray-200 rounded-lg">
        {filteredEndpoints.map((endpoint, index) => (
          <div
            key={`${endpoint.method}-${endpoint.path}`}
            className="flex items-start space-x-3 p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
            onClick={() => toggleEndpoint(index)}
          >
            {endpoint.selected ? (
              <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
              <span
                className={`uppercase font-mono text-sm px-2 py-0.5 rounded ${
                  endpoint.method === 'get'
                    ? 'bg-green-100 text-green-700'
                    : endpoint.method === 'post'
                      ? 'bg-blue-100 text-blue-700'
                      : endpoint.method === 'put'
                        ? 'bg-yellow-100 text-yellow-700'
                        : endpoint.method === 'delete'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                }`}
              >
                {endpoint.method}
              </span>
              <span className="font-mono text-sm break-all">{endpoint.path}</span>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="flex justify-between space-x-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

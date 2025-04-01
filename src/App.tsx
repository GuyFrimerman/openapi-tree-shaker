import React, { useState } from 'react';
import { ImportPage } from './pages/ImportPage';
import { SelectionPage } from './pages/SelectionPage';
import { PreviewPage } from './pages/PreviewPage';
import { RotateCcw } from 'lucide-react';
import { treeShakeOpenAPI } from './lib/tree-shaker';
import type { Endpoint } from './types/openapi';

function App() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [spec, setSpec] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [outputFormat, setOutputFormat] = useState<'json' | 'yaml'>('json');

  const handleStartOver = () => {
    setCurrentStep(0);
    setSpec(null);
    setEndpoints([]);
    setOutputFormat('json');
  };

  const getTreeShakenSpec = () => {
    if (!spec) return null;

    const patterns = endpoints
      .filter(e => e.selected)
      .map(e => `^${e.path.replace(/\{[^}]+\}/g, '[^/]+')}$`);

    return treeShakeOpenAPI(spec, patterns.length > 0 ? patterns : undefined);
  };

  const steps = [
    {
      title: 'Import',
      component: (
        <ImportPage
          onSpecLoaded={(newSpec: any) => {
            setSpec(newSpec);
            const newEndpoints: Endpoint[] = [];
            Object.entries(newSpec.paths).forEach(([path, methods]: [string, any]) => {
              Object.keys(methods).forEach(method => {
                newEndpoints.push({ path, method, selected: true });
              });
            });
            setEndpoints(newEndpoints);
            setCurrentStep(1);
          }}
        />
      ),
    },
    {
      title: 'Select',
      component: (
        <SelectionPage
          endpoints={endpoints}
          setEndpoints={setEndpoints}
          onNext={() => setCurrentStep(2)}
          onBack={() => setCurrentStep(0)}
        />
      ),
    },
    {
      title: 'Preview',
      component: (
        <PreviewPage
          spec={spec}
          treeShakenResult={getTreeShakenSpec()}
          outputFormat={outputFormat}
          setOutputFormat={setOutputFormat}
          onBack={() => setCurrentStep(1)}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar and Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">
                {steps[currentStep].title}
              </h1>
              {currentStep > 0 && (
                <button
                  onClick={handleStartOver}
                  className="text-gray-600 hover:text-gray-800 flex items-center space-x-1 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start Over</span>
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.title}>
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`ml-2 ${
                        index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Mobile Progress Indicator */}
          <div className="sm:hidden flex items-center justify-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`w-2.5 h-2.5 rounded-full ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white rounded-lg shadow-md">
          {steps[currentStep].component}
        </div>
      </div>
    </div>
  );
}

export default App;
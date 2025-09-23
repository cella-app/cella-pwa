'use client';

import React, { useState, useEffect } from 'react';
import { 
  runAllTests, 
  runSingleTest, 
  TestResult, 
  TEST_CASES,
  TestCase 
} from '@/utils/positioningTest';

const PositioningTestComponent: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const testResults = runAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSingleTestCase = (testCase: TestCase) => {
    setSelectedTest(testCase);
    const result = runSingleTest(testCase);
    setResults([result]);
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runTests();
  }, []);

  const getStatusIcon = (isReasonable: boolean) => {
    return isReasonable ? '✅' : '❌';
  };

  const getStatusColor = (isReasonable: boolean) => {
    return isReasonable ? '#28a745' : '#dc3545';
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        📱 Positioning Test Suite
      </h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <select 
          onChange={(e) => {
            const testCase = TEST_CASES.find(tc => tc.name === e.target.value);
            if (testCase) runSingleTestCase(testCase);
          }}
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        >
          <option value="">Select Single Test</option>
          {TEST_CASES.map(tc => (
            <option key={tc.name} value={tc.name}>
              {tc.name}
            </option>
          ))}
        </select>
      </div>

      {results.length > 0 && (
        <div>
          <h2 style={{ color: '#333' }}>
            Test Results ({results.filter(r => r.isReasonable).length}/{results.length} passed)
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gap: '15px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
          }}>
            {results.map((result, index) => (
              <div 
                key={index}
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${getStatusColor(result.isReasonable)}`,
                  borderRadius: '8px',
                  padding: '15px',
                  fontSize: '12px'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 10px 0',
                  color: getStatusColor(result.isReasonable),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {getStatusIcon(result.isReasonable)} {result.testCase.name}
                </h3>
                
                <div style={{ marginBottom: '10px', color: '#666' }}>
                  {result.testCase.description}
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  fontSize: '11px'
                }}>
                  <div>
                    <strong>Screen:</strong> {result.testCase.windowWidth}×{result.testCase.windowHeight}
                  </div>
                  <div>
                    <strong>Env:</strong> {
                      result.testCase.isStandalone ? 'PWA' : 
                      result.testCase.isSafari ? 'Safari' : 
                      result.testCase.isIOS ? 'iOS Other' : 'Desktop'
                    }
                  </div>
                </div>

                <div style={{ 
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                }}>
                  <div><strong>AddToHome:</strong></div>
                  <div>• Offset: {result.addToHomeBottomOffset} ({result.addToHomeBottomPixels}px)</div>
                  <div>• Position: ({result.addToHomePosition.x}, {result.addToHomePosition.y})</div>
                  
                  <div style={{ marginTop: '8px' }}><strong>Locate:</strong></div>
                  <div>• Offset: {result.locateButtonBottomOffset} ({result.locateButtonBottomPixels}px)</div>
                  <div>• Position: ({result.locateButtonPosition.x}, {result.locateButtonPosition.y})</div>
                </div>

                {result.issues.length > 0 && (
                  <div style={{ 
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px',
                    color: '#856404'
                  }}>
                    <strong>Issues:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                      {result.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Visual preview */}
                <div style={{ 
                  marginTop: '10px',
                  position: 'relative',
                  width: '100%',
                  height: '150px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#e9ecef'
                }}>
                  <div style={{ 
                    position: 'absolute',
                    top: '5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    color: '#666'
                  }}>
                    {result.testCase.windowWidth}×{result.testCase.windowHeight}
                  </div>
                  
                  {/* AddToHome button preview */}
                  <div style={{
                    position: 'absolute',
                    left: `${(result.addToHomePosition.x / result.testCase.windowWidth) * 100}%`,
                    bottom: `${((result.testCase.windowHeight - result.addToHomePosition.y - 48) / result.testCase.windowHeight) * 100}%`,
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#007bff',
                    borderRadius: '50%',
                    border: '1px solid white'
                  }} title="AddToHome" />
                  
                  {/* Locate button preview */}
                  <div style={{
                    position: 'absolute',
                    right: `${(24 / result.testCase.windowWidth) * 100}%`,
                    bottom: `${(result.locateButtonBottomPixels / result.testCase.windowHeight) * 100}%`,
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#28a745',
                    borderRadius: '2px',
                    border: '1px solid white'
                  }} title="Locate" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PositioningTestComponent;
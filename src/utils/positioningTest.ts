// Test suite for positioning calculations across devices and browsers
import { 
  getBottomOffset, 
  getLocateButtonBottomOffset, 
  SPACING,
  BUTTON_SIZES 
} from '@/shared/utils/positioning';

// Test data for different device/browser combinations
export interface TestCase {
  name: string;
  windowWidth: number;
  windowHeight: number;
  isSafari: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  description: string;
}

export const TEST_CASES: TestCase[] = [
  // Desktop browsers
  {
    name: 'Desktop Chrome/Firefox',
    windowWidth: 1920,
    windowHeight: 1080,
    isSafari: false,
    isIOS: false,
    isStandalone: false,
    description: 'Standard desktop browser'
  },
  {
    name: 'Desktop Safari',
    windowWidth: 1440,
    windowHeight: 900,
    isSafari: true,
    isIOS: false,
    isStandalone: false,
    description: 'macOS Safari'
  },
  
  // iOS Safari (URL bar at bottom)
  {
    name: 'iPhone 15 Pro Safari',
    windowWidth: 393,
    windowHeight: 852,
    isSafari: true,
    isIOS: true,
    isStandalone: false,
    description: 'iOS Safari with bottom URL bar'
  },
  {
    name: 'iPhone SE Safari',
    windowWidth: 375,
    windowHeight: 667,
    isSafari: true,
    isIOS: true,
    isStandalone: false,
    description: 'Small iPhone Safari'
  },
  {
    name: 'iPhone Large Display Mode',
    windowWidth: 320,
    windowHeight: 568,
    isSafari: true,
    isIOS: true,
    isStandalone: false,
    description: 'iPhone with large display accessibility'
  },
  
  // iOS Chrome/Edge
  {
    name: 'iPhone 15 Pro Chrome',
    windowWidth: 393,
    windowHeight: 852,
    isSafari: false,
    isIOS: true,
    isStandalone: false,
    description: 'iOS Chrome browser'
  },
  {
    name: 'iPhone SE Chrome',
    windowWidth: 375,
    windowHeight: 667,
    isSafari: false,
    isIOS: true,
    isStandalone: false,
    description: 'Small iPhone Chrome'
  },
  
  // iOS PWA
  {
    name: 'iPhone 15 Pro PWA',
    windowWidth: 393,
    windowHeight: 852,
    isSafari: true,
    isIOS: true,
    isStandalone: true,
    description: 'iOS PWA (no browser UI)'
  },
  {
    name: 'iPhone SE PWA',
    windowWidth: 375,
    windowHeight: 667,
    isSafari: true,
    isIOS: true,
    isStandalone: true,
    description: 'Small iPhone PWA'
  },
  
  // Android Chrome
  {
    name: 'Android Phone Chrome',
    windowWidth: 412,
    windowHeight: 915,
    isSafari: false,
    isIOS: false,
    isStandalone: false,
    description: 'Android Chrome browser'
  },
  {
    name: 'Android Tablet Chrome',
    windowWidth: 768,
    windowHeight: 1024,
    isSafari: false,
    isIOS: false,
    isStandalone: false,
    description: 'Android tablet Chrome'
  },
  
  // Android PWA
  {
    name: 'Android Phone PWA',
    windowWidth: 412,
    windowHeight: 915,
    isSafari: false,
    isIOS: false,
    isStandalone: true,
    description: 'Android PWA'
  },
  {
    name: 'Android Tablet PWA',
    windowWidth: 768,
    windowHeight: 1024,
    isSafari: false,
    isIOS: false,
    isStandalone: true,
    description: 'Android tablet PWA'
  }
];

// Mock window object for testing
function mockWindow(width: number, height: number) {
  Object.defineProperty(global, 'window', {
    value: {
      innerWidth: width,
      innerHeight: height
    },
    writable: true
  });
}

// Test result interface
export interface TestResult {
  testCase: TestCase;
  addToHomeBottomOffset: string;
  locateButtonBottomOffset: string;
  addToHomeBottomPixels: number;
  locateButtonBottomPixels: number;
  addToHomePosition: { x: number; y: number };
  locateButtonPosition: { x: number; y: number };
  isReasonable: boolean;
  issues: string[];
}

// Convert pt to pixels (1pt = 1.33px approximately)
function ptToPixels(ptValue: string): number {
  const ptNumber = parseFloat(ptValue.replace('pt', ''));
  return Math.round(ptNumber * 1.33);
}

// Check if positioning is reasonable
function validatePositioning(testCase: TestCase, result: any): { isReasonable: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check if buttons are within screen bounds
  if (result.addToHomePosition.x < 0 || result.addToHomePosition.x > testCase.windowWidth - BUTTON_SIZES.ADD_TO_HOME) {
    issues.push('AddToHome X position out of bounds');
  }
  
  if (result.addToHomePosition.y < 0 || result.addToHomePosition.y > testCase.windowHeight - BUTTON_SIZES.ADD_TO_HOME) {
    issues.push('AddToHome Y position out of bounds');
  }
  
  // Check minimum touch target spacing (44px recommended)
  const minTouchSpacing = 44;
  const addToHomeBottomSpace = testCase.windowHeight - result.addToHomePosition.y - BUTTON_SIZES.ADD_TO_HOME;
  const locateBottomSpace = result.locateButtonBottomPixels;
  
  if (addToHomeBottomSpace < 8) {
    issues.push(`AddToHome too close to bottom (${addToHomeBottomSpace}px)`);
  }
  
  if (locateBottomSpace < 8) {
    issues.push(`Locate button too close to bottom (${locateBottomSpace}px)`);
  }
  
  // Check for overlap (buttons should not overlap)
  const buttonsOnSameRow = Math.abs(result.addToHomePosition.y - (testCase.windowHeight - locateBottomSpace - BUTTON_SIZES.LOCATE_CONTROL)) < 10;
  if (buttonsOnSameRow) {
    const horizontalDistance = Math.abs(result.addToHomePosition.x - (testCase.windowWidth - SPACING.EDGE_MARGIN - BUTTON_SIZES.LOCATE_CONTROL));
    if (horizontalDistance < BUTTON_SIZES.ADD_TO_HOME + BUTTON_SIZES.LOCATE_CONTROL + 8) {
      issues.push('Buttons may overlap');
    }
  }
  
  return {
    isReasonable: issues.length === 0,
    issues
  };
}

// Run positioning test for a single test case
export function runSingleTest(testCase: TestCase): TestResult {
  // Mock the window for this test
  mockWindow(testCase.windowWidth, testCase.windowHeight);
  
  // Get positioning values
  const addToHomeBottomOffset = getBottomOffset(testCase.isSafari, testCase.isIOS, testCase.isStandalone);
  const locateButtonBottomOffset = getLocateButtonBottomOffset(testCase.isSafari, testCase.isIOS, testCase.isStandalone);
  
  // Convert to pixels
  const addToHomeBottomPixels = ptToPixels(addToHomeBottomOffset);
  const locateButtonBottomPixels = ptToPixels(locateButtonBottomOffset);
  
  // Calculate positions
  const addToHomePosition = {
    x: SPACING.EDGE_MARGIN,
    y: testCase.windowHeight - addToHomeBottomPixels - BUTTON_SIZES.ADD_TO_HOME
  };
  
  const locateButtonPosition = {
    x: testCase.windowWidth - SPACING.EDGE_MARGIN - BUTTON_SIZES.LOCATE_CONTROL,
    y: testCase.windowHeight - locateButtonBottomPixels - BUTTON_SIZES.LOCATE_CONTROL
  };
  
  // Validate positioning
  const validation = validatePositioning(testCase, {
    addToHomePosition,
    locateButtonBottomPixels
  });
  
  return {
    testCase,
    addToHomeBottomOffset,
    locateButtonBottomOffset, 
    addToHomeBottomPixels,
    locateButtonBottomPixels,
    addToHomePosition,
    locateButtonPosition,
    isReasonable: validation.isReasonable,
    issues: validation.issues
  };
}

// Run all tests
export function runAllTests(): TestResult[] {
  return TEST_CASES.map(runSingleTest);
}

// Pretty print test results
export function printTestResults(results: TestResult[]): void {
  console.log('\n=== POSITIONING TEST RESULTS ===\n');
  
  results.forEach((result, index) => {
    const { testCase } = result;
    console.log(`${index + 1}. ${testCase.name} (${testCase.windowWidth}x${testCase.windowHeight})`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   AddToHome: ${result.addToHomeBottomOffset} (${result.addToHomeBottomPixels}px) at (${result.addToHomePosition.x}, ${result.addToHomePosition.y})`);
    console.log(`   Locate: ${result.locateButtonBottomOffset} (${result.locateButtonBottomPixels}px) at (${result.locateButtonPosition.x}, ${result.locateButtonPosition.y})`);
    console.log(`   Status: ${result.isReasonable ? '✅ OK' : '❌ ISSUES'}`);
    
    if (result.issues.length > 0) {
      console.log(`   Issues: ${result.issues.join(', ')}`);
    }
    console.log('');
  });
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.isReasonable).length;
  console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} tests passed ===\n`);
}

// Quick test function to run in browser console
export function quickTest(): void {
  const results = runAllTests();
  printTestResults(results);
}
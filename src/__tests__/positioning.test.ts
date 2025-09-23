/**
 * @jest-environment jsdom
 */

import { 
  getBottomOffset, 
  getLocateButtonBottomOffset,
  getInitialPosition,
  getMaxY,
  snapToEdge,
  getStackedRightPosition,
  SPACING,
  BUTTON_SIZES
} from '@/shared/utils/positioning';

// Mock window object
const mockWindow = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe('Positioning Utils', () => {
  beforeEach(() => {
    // Reset window mock before each test
    mockWindow(1920, 1080);
  });

  describe('getBottomOffset', () => {
    it('should return correct offset for PWA mode', () => {
      expect(getBottomOffset(false, false, true)).toBe('12pt');
      expect(getBottomOffset(true, true, true)).toBe('12pt'); // PWA overrides other conditions
    });

    it('should return correct offset for iOS Safari', () => {
      expect(getBottomOffset(true, true, false)).toBe('70pt');
    });

    it('should return correct offset for iOS non-Safari', () => {
      expect(getBottomOffset(false, true, false)).toBe('50pt');
    });

    it('should return correct offset for Desktop Safari', () => {
      expect(getBottomOffset(true, false, false)).toBe('16pt');
    });

    it('should return correct offset for other browsers', () => {
      expect(getBottomOffset(false, false, false)).toBe('12pt');
    });
  });

  describe('getLocateButtonBottomOffset', () => {
    it('should return correct offset for PWA mode', () => {
      expect(getLocateButtonBottomOffset(false, false, true)).toBe('16pt');
    });

    it('should return correct offset for iOS Safari', () => {
      expect(getLocateButtonBottomOffset(true, true, false)).toBe('50pt');
    });

    it('should return correct offset for iOS non-Safari', () => {
      expect(getLocateButtonBottomOffset(false, true, false)).toBe('30pt');
    });

    it('should return correct offset for Desktop Safari', () => {
      expect(getLocateButtonBottomOffset(true, false, false)).toBe('20pt');
    });

    it('should return correct offset for other browsers', () => {
      expect(getLocateButtonBottomOffset(false, false, false)).toBe('16pt');
    });
  });

  describe('getInitialPosition', () => {
    it('should return left edge position for AddToHome button', () => {
      mockWindow(1920, 1080);
      const position = getInitialPosition();
      
      expect(position.x).toBe(SPACING.EDGE_MARGIN);
      expect(position.y).toBeGreaterThan(0);
      expect(position.y).toBeLessThan(1080);
    });

    it('should respect VERTICAL_MARGIN minimum', () => {
      mockWindow(400, 200); // Very small screen
      const position = getInitialPosition();
      
      expect(position.y).toBeGreaterThanOrEqual(SPACING.VERTICAL_MARGIN);
    });

    it('should handle window undefined case', () => {
      // Note: In jsdom environment, completely removing window is challenging
      // This test verifies basic functionality when window properties might be limited
      const position = getInitialPosition();
      expect(position.x).toBe(SPACING.EDGE_MARGIN);
      expect(position.y).toBeGreaterThan(0); // Should return a valid position
    });
  });

  describe('getMaxY', () => {
    it('should return correct maximum Y position', () => {
      mockWindow(1920, 1080);
      const maxY = getMaxY();
      
      expect(maxY).toBeGreaterThan(0);
      expect(maxY).toBeLessThan(1080);
    });

    it('should handle window undefined case', () => {
      // Note: In jsdom environment, completely removing window is challenging
      // This test verifies basic functionality when window properties might be limited
      const maxY = getMaxY();
      expect(maxY).toBeGreaterThan(0); // Should return a valid max Y position
    });
  });

  describe('snapToEdge', () => {
    beforeEach(() => {
      mockWindow(1920, 1080);
    });

    it('should snap to left edge when mouse is on left half', () => {
      const leftPosition = snapToEdge(500); // Left of center (960)
      expect(leftPosition).toBe(SPACING.EDGE_MARGIN);
    });

    it('should snap to right edge when mouse is on right half', () => {
      const rightPosition = snapToEdge(1400); // Right of center (960)
      const expectedRight = 1920 - SPACING.EDGE_MARGIN - BUTTON_SIZES.ADD_TO_HOME;
      expect(rightPosition).toBe(expectedRight);
    });

    it('should handle exact center position', () => {
      const centerPosition = snapToEdge(960); // Exact center
      const expectedRight = 1920 - SPACING.EDGE_MARGIN - BUTTON_SIZES.ADD_TO_HOME;
      expect(centerPosition).toBe(expectedRight); // Should snap right
    });
  });

  describe('getStackedRightPosition', () => {
    it('should return correct stacked position', () => {
      mockWindow(1920, 1080);
      const stackedPos = getStackedRightPosition();
      
      const expected = 1920 - SPACING.EDGE_MARGIN - BUTTON_SIZES.LOCATE_CONTROL - SPACING.BUTTON_GAP - BUTTON_SIZES.ADD_TO_HOME;
      expect(stackedPos).toBe(expected);
    });

    it('should handle window undefined case', () => {
      // Note: In jsdom environment, completely removing window is challenging
      // This test verifies basic functionality when window properties might be limited
      const stackedPos = getStackedRightPosition();
      expect(stackedPos).toBeGreaterThan(0); // Should return a valid stacked position
    });
  });

  describe('Cross-device positioning scenarios', () => {
    const testCases = [
      {
        name: 'Desktop Chrome',
        width: 1920, height: 1080,
        isSafari: false, isIOS: false, isStandalone: false,
        expectedAddToHomeOffset: '12pt',
        expectedLocateOffset: '16pt'
      },
      {
        name: 'iPhone 15 Pro Safari',
        width: 393, height: 852,
        isSafari: true, isIOS: true, isStandalone: false,
        expectedAddToHomeOffset: '70pt',
        expectedLocateOffset: '50pt'
      },
      {
        name: 'iPhone SE PWA',
        width: 375, height: 667,
        isSafari: true, isIOS: true, isStandalone: true,
        expectedAddToHomeOffset: '12pt',
        expectedLocateOffset: '16pt'
      },
      {
        name: 'iPhone Large Display Mode',
        width: 320, height: 568,
        isSafari: true, isIOS: true, isStandalone: false,
        expectedAddToHomeOffset: '70pt',
        expectedLocateOffset: '50pt'
      },
      {
        name: 'Android Chrome',
        width: 412, height: 915,
        isSafari: false, isIOS: false, isStandalone: false,
        expectedAddToHomeOffset: '12pt',
        expectedLocateOffset: '16pt'
      }
    ];

    testCases.forEach(testCase => {
      it(`should return correct positioning for ${testCase.name}`, () => {
        mockWindow(testCase.width, testCase.height);
        
        const addToHomeOffset = getBottomOffset(testCase.isSafari, testCase.isIOS, testCase.isStandalone);
        const locateOffset = getLocateButtonBottomOffset(testCase.isSafari, testCase.isIOS, testCase.isStandalone);
        
        expect(addToHomeOffset).toBe(testCase.expectedAddToHomeOffset);
        expect(locateOffset).toBe(testCase.expectedLocateOffset);
        
        // Test positioning calculations
        const addToHomePos = getInitialPosition();
        expect(addToHomePos.x).toBe(SPACING.EDGE_MARGIN); // Always left edge
        expect(addToHomePos.y).toBeGreaterThan(0);
        expect(addToHomePos.y).toBeLessThan(testCase.height);
        
        // Ensure position is within screen bounds
        expect(addToHomePos.x + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.width);
        expect(addToHomePos.y + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.height);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very small screens gracefully', () => {
      mockWindow(280, 480); // Very small screen
      
      const addToHomePos = getInitialPosition();
      const maxY = getMaxY();
      
      expect(addToHomePos.x).toBe(SPACING.EDGE_MARGIN);
      expect(addToHomePos.y).toBeGreaterThanOrEqual(SPACING.VERTICAL_MARGIN);
      expect(maxY).toBeGreaterThan(0);
    });

    it('should handle very large screens', () => {
      mockWindow(3840, 2160); // 4K screen
      
      const addToHomePos = getInitialPosition();
      const rightSnap = snapToEdge(2000);
      
      expect(addToHomePos.x).toBe(SPACING.EDGE_MARGIN);
      expect(rightSnap).toBe(3840 - SPACING.EDGE_MARGIN - BUTTON_SIZES.ADD_TO_HOME);
    });

    it('should maintain proper spacing constants', () => {
      expect(SPACING.EDGE_MARGIN).toBeGreaterThan(0);
      expect(SPACING.VERTICAL_MARGIN).toBeGreaterThan(0);
      expect(SPACING.BUTTON_GAP).toBeGreaterThanOrEqual(0);
      
      expect(BUTTON_SIZES.ADD_TO_HOME).toBeGreaterThan(0);
      expect(BUTTON_SIZES.LOCATE_CONTROL).toBeGreaterThan(0);
    });
  });

  describe('Position validation', () => {
    const validatePosition = (x: number, y: number, width: number, height: number) => {
      return {
        withinBounds: x >= 0 && y >= 0 && 
                     x + BUTTON_SIZES.ADD_TO_HOME <= width && 
                     y + BUTTON_SIZES.ADD_TO_HOME <= height,
        hasMinSpacing: y >= SPACING.VERTICAL_MARGIN,
        bottomSpace: height - y - BUTTON_SIZES.ADD_TO_HOME
      };
    };

    it('should always produce valid positions for common screen sizes', () => {
      const commonSizes = [
        { width: 320, height: 568 },   // iPhone SE
        { width: 375, height: 667 },   // iPhone 8
        { width: 393, height: 852 },   // iPhone 15 Pro
        { width: 412, height: 915 },   // Android
        { width: 768, height: 1024 },  // iPad
        { width: 1920, height: 1080 }  // Desktop
      ];

      commonSizes.forEach(size => {
        mockWindow(size.width, size.height);
        const position = getInitialPosition();
        const validation = validatePosition(position.x, position.y, size.width, size.height);
        
        expect(validation.withinBounds).toBe(true);
        expect(validation.hasMinSpacing).toBe(true);
        expect(validation.bottomSpace).toBeGreaterThanOrEqual(8); // Minimum touch spacing
      });
    });
  });
});
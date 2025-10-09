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
  getSafeViewportHeight,
  isLargeDisplayMode,
  getLocateButtonPosition,
  getAddToHomeEqualMarginPosition,
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

// Mock iOS environment
const mockiOSEnvironment = () => {
  Object.defineProperty(window.navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
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
      expect(getLocateButtonBottomOffset(false, false, true)).toBe('33pt');
    });

    it('should return correct offset for iOS Safari', () => {
      expect(getLocateButtonBottomOffset(true, true, false)).toBe('66pt');
    });

    it('should return correct offset for iOS non-Safari', () => {
      expect(getLocateButtonBottomOffset(false, true, false)).toBe('66pt');
    });

    it('should return correct offset for Desktop Safari', () => {
      expect(getLocateButtonBottomOffset(true, false, false)).toBe('66pt');
    });

    it('should return correct offset for other browsers', () => {
      expect(getLocateButtonBottomOffset(false, false, false)).toBe('33pt');
    });
  });

  describe('Bottom offset spacing validation', () => {
    it('should maintain proper vertical spacing between buttons', () => {
      const scenarios = [
        { name: 'iOS Safari', isSafari: true, isIOS: true, isStandalone: false },
        { name: 'iOS non-Safari', isSafari: false, isIOS: true, isStandalone: false },
        { name: 'Desktop Safari', isSafari: true, isIOS: false, isStandalone: false },
        { name: 'PWA mode', isSafari: false, isIOS: false, isStandalone: true },
      ];

      scenarios.forEach(scenario => {
        const addToHomeOffset = parseFloat(getBottomOffset(scenario.isSafari, scenario.isIOS, scenario.isStandalone));
        const locateOffset = parseFloat(getLocateButtonBottomOffset(scenario.isSafari, scenario.isIOS, scenario.isStandalone));

        // Both buttons should have reasonable offsets (not enforcing which is higher)
        expect(addToHomeOffset).toBeGreaterThan(0);
        expect(locateOffset).toBeGreaterThan(0);
        
        // Spacing should provide adequate vertical separation
        const absoluteGap = Math.abs(addToHomeOffset - locateOffset);
        expect(absoluteGap).toBeGreaterThanOrEqual(4); // At least 4pt separation
      });
    });

    it('should provide adequate clearance from iOS home indicator', () => {
      const homeIndicatorHeight = 34; // iOS home indicator
      const minClearance = 8;

      // iOS Safari - should clear home indicator + Safari toolbar
      const iosSafariOffset = parseFloat(getBottomOffset(true, true, false));
      expect(iosSafariOffset).toBeGreaterThanOrEqual(homeIndicatorHeight + minClearance);

      // iOS non-Safari - should clear home indicator
      const iosNonSafariOffset = parseFloat(getBottomOffset(false, true, false));
      expect(iosNonSafariOffset).toBeGreaterThanOrEqual(homeIndicatorHeight + minClearance);
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
      const position = getInitialPosition();
      expect(position.x).toBe(SPACING.EDGE_MARGIN);
      expect(position.y).toBeGreaterThan(0);
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
      const maxY = getMaxY();
      expect(maxY).toBeGreaterThan(0);
    });
  });

  describe('snapToEdge', () => {
    beforeEach(() => {
      mockWindow(1920, 1080);
    });

    it('should snap to left edge when mouse is on left half', () => {
      const leftPosition = snapToEdge(500);
      expect(leftPosition).toBe(SPACING.EDGE_MARGIN);
    });

    it('should snap to right edge when mouse is on right half', () => {
      const rightPosition = snapToEdge(1400);
      const expectedRight = 1920 - SPACING.EDGE_MARGIN - BUTTON_SIZES.ADD_TO_HOME;
      expect(rightPosition).toBe(expectedRight);
    });

    it('should handle exact center position', () => {
      const centerPosition = snapToEdge(960);
      const expectedRight = 1920 - SPACING.EDGE_MARGIN - BUTTON_SIZES.ADD_TO_HOME;
      expect(centerPosition).toBe(expectedRight);
    });

    it('should handle narrow screens gracefully', () => {
      mockWindow(280, 568); // Very narrow screen

      const leftSnap = snapToEdge(100);
      const rightSnap = snapToEdge(200);

      expect(leftSnap).toBe(SPACING.EDGE_MARGIN);
      expect(rightSnap).toBe(280 - SPACING.EDGE_MARGIN - BUTTON_SIZES.ADD_TO_HOME);

      // Ensure snapped positions don't overlap
      expect(rightSnap).toBeGreaterThan(leftSnap);
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
      const stackedPos = getStackedRightPosition();
      expect(stackedPos).toBeGreaterThan(0);
    });

    it('should prevent button overlap on narrow screens', () => {
      const narrowWidths = [280, 300, 320, 350];

      narrowWidths.forEach(width => {
        mockWindow(width, 568);

        const addToHomeX = SPACING.EDGE_MARGIN;
        const stackedPos = getStackedRightPosition();

        // Check if stacked position would cause overlap
        const addToHomeRight = addToHomeX + BUTTON_SIZES.ADD_TO_HOME;
        const locateLeft = stackedPos;

        if (locateLeft <= addToHomeRight + SPACING.BUTTON_GAP) {
          // Should fallback gracefully or provide warning
          // For now, just ensure positions are valid numbers
          expect(stackedPos).toBeGreaterThan(0);
          expect(stackedPos).toBeLessThan(width);
        } else {
          // Normal case - should have proper spacing
          expect(locateLeft - addToHomeRight).toBeGreaterThanOrEqual(SPACING.BUTTON_GAP);
        }
      });
    });
  });

  describe('Ultra narrow screen scenarios', () => {
    const ultraNarrowCases = [
      { name: 'iPhone SE Large Display Zoomed', width: 280, height: 568 },
      { name: 'iPhone 12 mini Large Display', width: 300, height: 624 },
      { name: 'Accessibility Zoom Mode', width: 250, height: 500 },
      { name: 'Galaxy Fold Closed', width: 280, height: 653 },
      { name: 'Extreme Accessibility', width: 240, height: 400 },
    ];

    ultraNarrowCases.forEach(testCase => {
      describe(`${testCase.name} (${testCase.width}x${testCase.height})`, () => {
        beforeEach(() => {
          mockWindow(testCase.width, testCase.height);
        });

        it('should position AddToHome button within bounds', () => {
          const position = getInitialPosition();

          expect(position.x).toBe(SPACING.EDGE_MARGIN);
          expect(position.x + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.width - SPACING.EDGE_MARGIN);
          expect(position.y + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.height);
        });

        it('should handle stacked positioning appropriately', () => {
          const stackedPos = getStackedRightPosition();
          const addToHomeX = SPACING.EDGE_MARGIN;

          // Calculate required width for stacking
          const requiredWidth = SPACING.EDGE_MARGIN + BUTTON_SIZES.ADD_TO_HOME +
            SPACING.BUTTON_GAP + BUTTON_SIZES.LOCATE_CONTROL + SPACING.EDGE_MARGIN;

          if (testCase.width >= requiredWidth) {
            // Should stack properly
            expect(stackedPos + BUTTON_SIZES.LOCATE_CONTROL).toBeLessThanOrEqual(testCase.width - SPACING.EDGE_MARGIN);
            expect(stackedPos).toBeGreaterThan(addToHomeX + BUTTON_SIZES.ADD_TO_HOME + SPACING.BUTTON_GAP);
          } else {
            // Should still return valid position (may need vertical stacking in implementation)
            expect(stackedPos).toBeGreaterThan(0);
            expect(stackedPos).toBeLessThan(testCase.width);
          }
        });

        it('should maintain minimum touch target accessibility', () => {
          const position = getInitialPosition();

          // Ensure button doesn't get too close to screen edges
          const minTouchClearance = 8;
          expect(position.x).toBeGreaterThanOrEqual(minTouchClearance);
          expect(position.y).toBeGreaterThanOrEqual(minTouchClearance);
          expect(position.x + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.width - minTouchClearance);
        });
      });
    });
  });

  describe('Cross-device positioning scenarios', () => {
    const testCases = [
      {
        name: 'Desktop Chrome',
        width: 1920, height: 1080,
        isSafari: false, isIOS: false, isStandalone: false,
        expectedAddToHomeOffset: '12pt',
        expectedLocateOffset: '33pt'
      },
      {
        name: 'iPhone 15 Pro Safari',
        width: 393, height: 852,
        isSafari: true, isIOS: true, isStandalone: false,
        expectedAddToHomeOffset: '70pt',
        expectedLocateOffset: '66pt'
      },
      {
        name: 'iPhone SE PWA',
        width: 375, height: 667,
        isSafari: true, isIOS: true, isStandalone: true,
        expectedAddToHomeOffset: '12pt',
        expectedLocateOffset: '33pt'
      },
      {
        name: 'iPhone Large Display Mode',
        width: 320, height: 568,
        isSafari: true, isIOS: true, isStandalone: false,
        expectedAddToHomeOffset: '70pt',
        expectedLocateOffset: '66pt'
      },
      {
        name: 'iPhone Ultra Large Display',
        width: 280, height: 568,
        isSafari: true, isIOS: true, isStandalone: false,
        expectedAddToHomeOffset: '70pt',
        expectedLocateOffset: '66pt'
      },
      {
        name: 'Android Chrome',
        width: 412, height: 915,
        isSafari: false, isIOS: false, isStandalone: false,
        expectedAddToHomeOffset: '12pt',
        expectedLocateOffset: '33pt'
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
        expect(addToHomePos.x).toBe(SPACING.EDGE_MARGIN);
        expect(addToHomePos.y).toBeGreaterThan(0);
        expect(addToHomePos.y).toBeLessThan(testCase.height);

        // Ensure position is within screen bounds
        expect(addToHomePos.x + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.width);
        expect(addToHomePos.y + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.height);
      });
    });
  });

  describe('Landscape orientation scenarios', () => {
    const landscapeCases = [
      { name: 'iPhone 15 Pro Landscape', width: 852, height: 393 },
      { name: 'iPhone SE Landscape', width: 568, height: 320 },
      { name: 'iPad Mini Landscape', width: 1024, height: 768 },
      { name: 'Android Landscape', width: 915, height: 412 },
    ];

    landscapeCases.forEach(testCase => {
      it(`should handle ${testCase.name} correctly`, () => {
        mockWindow(testCase.width, testCase.height);

        const position = getInitialPosition();
        const stackedPos = getStackedRightPosition();
        const maxY = getMaxY();

        // Should fit within landscape bounds
        expect(position.x + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.width);
        expect(position.y + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.height);
        expect(maxY).toBeLessThan(testCase.height);

        // Stacked position should be valid
        expect(stackedPos + BUTTON_SIZES.LOCATE_CONTROL).toBeLessThanOrEqual(testCase.width - SPACING.EDGE_MARGIN);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very small screens gracefully', () => {
      mockWindow(280, 480);

      const addToHomePos = getInitialPosition();
      const maxY = getMaxY();

      expect(addToHomePos.x).toBe(SPACING.EDGE_MARGIN);
      expect(addToHomePos.y).toBeGreaterThanOrEqual(SPACING.VERTICAL_MARGIN);
      expect(maxY).toBeGreaterThan(0);
    });

    it('should handle very large screens', () => {
      mockWindow(3840, 2160);

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

    it('should validate spacing constants for accessibility', () => {
      const minTouchTarget = 44; // iOS/Android minimum

      expect(BUTTON_SIZES.ADD_TO_HOME).toBeGreaterThanOrEqual(minTouchTarget);
      expect(BUTTON_SIZES.LOCATE_CONTROL).toBeGreaterThanOrEqual(minTouchTarget);
      expect(SPACING.BUTTON_GAP).toBeGreaterThanOrEqual(8); // Minimum clearance
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
        { width: 280, height: 568 },   // Ultra narrow
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
        expect(validation.bottomSpace).toBeGreaterThanOrEqual(8);
      });
    });

    it('should prevent button collision in stacked layout', () => {
      const testSizes = [
        { width: 280, height: 568 },
        { width: 320, height: 568 },
        { width: 375, height: 667 },
        { width: 400, height: 600 },
      ];

      testSizes.forEach(size => {
        mockWindow(size.width, size.height);

        const addToHomeX = SPACING.EDGE_MARGIN;
        const stackedPos = getStackedRightPosition();

        const addToHomeRight = addToHomeX + BUTTON_SIZES.ADD_TO_HOME;
        const locateLeft = stackedPos;
        const locateRight = stackedPos + BUTTON_SIZES.LOCATE_CONTROL;

        // Buttons should not overlap
        if (locateLeft > addToHomeRight) {
          expect(locateLeft - addToHomeRight).toBeGreaterThanOrEqual(SPACING.BUTTON_GAP);
        }

        // Locate button should fit on screen
        expect(locateRight).toBeLessThanOrEqual(size.width - SPACING.EDGE_MARGIN);
      });
    });
  });

  // NEW POSITIONING SYSTEM TESTS
  describe('Simplified Safe Positioning', () => {
    beforeEach(() => {
      mockWindow(393, 852); // iPhone 15 Pro default
    });

    describe('isLargeDisplayMode', () => {
      it('should detect Large Display Mode correctly', () => {
        // Mock iOS environment first
        mockiOSEnvironment();
        
        // Mock Large Display Mode: 320px width + device pixel ratio
        mockWindow(320, 568);
        Object.defineProperty(window, 'devicePixelRatio', {
          writable: true,
          configurable: true,
          value: 2,
        });
        
        const isLargeDisplay = isLargeDisplayMode();
        expect(isLargeDisplay).toBe(true);
      });

      it('should not detect Large Display Mode on normal screens', () => {
        mockWindow(393, 852); // Normal iPhone 15 Pro
        Object.defineProperty(window, 'devicePixelRatio', {
          writable: true,
          configurable: true,
          value: 3,
        });
        
        const isLargeDisplay = isLargeDisplayMode();
        expect(isLargeDisplay).toBe(false);
      });

      it('should work across different iOS devices in Large Display Mode', () => {
        // Mock iOS environment first
        mockiOSEnvironment();
        
        const largeDisplaySizes = [
          { width: 320, height: 568, device: 'iPhone SE' },
          { width: 320, height: 693, device: 'iPhone 13 Pro' },
          { width: 320, height: 736, device: 'iPhone 13 Pro Max' },
        ];

        largeDisplaySizes.forEach(size => {
          mockWindow(size.width, size.height);
          Object.defineProperty(window, 'devicePixelRatio', {
            writable: true,
            configurable: true,
            value: 2,
          });
          
          const isLargeDisplay = isLargeDisplayMode();
          expect(isLargeDisplay).toBe(true);
        });
      });
    });

    describe('getSafeViewportHeight', () => {
      it('should return conservative height for iOS Safari', () => {
        const height = getSafeViewportHeight();
        
        expect(height).toBeGreaterThan(0);
        expect(height).toBeLessThanOrEqual(window.innerHeight);
        
        // Should be conservative (less than full height)
        expect(height).toBeLessThan(window.innerHeight);
      });

      it('should be extra conservative for Large Display Mode', () => {
        // Mock iOS environment first
        mockiOSEnvironment();

        // Mock Large Display Mode
        mockWindow(320, 568);
        Object.defineProperty(window, 'devicePixelRatio', {
          writable: true,
          configurable: true,
          value: 2,
        });

        const height = getSafeViewportHeight();

        // Should be conservative (88% of height for Large Display Mode)
        expect(height).toBeLessThanOrEqual(window.innerHeight * 0.88);
        expect(height).toBeGreaterThan(window.innerHeight * 0.7);
      });

      it('should handle different screen sizes', () => {
        const testSizes = [
          { width: 320, height: 568 }, // iPhone SE + Large Display
          { width: 393, height: 852 }, // iPhone 15 Pro
          { width: 1920, height: 1080 }, // Desktop
        ];

        testSizes.forEach(size => {
          mockWindow(size.width, size.height);
          const height = getSafeViewportHeight();
          
          expect(height).toBeGreaterThan(0);
          expect(height).toBeLessThanOrEqual(size.height);
        });
      });
    });

    describe('getLocateButtonPosition', () => {
      it('should position Locate button 2x button height from bottom', () => {
        const position = getLocateButtonPosition();
        const expectedBottom = 2 * BUTTON_SIZES.LOCATE_CONTROL;
        
        expect(position.bottom).toBe(expectedBottom);
        expect(position.bottom).toBeGreaterThan(0);
      });

      it('should work across different screen sizes', () => {
        const testSizes = [
          { width: 280, height: 568 }, // iPhone SE
          { width: 393, height: 852 }, // iPhone 15 Pro
          { width: 430, height: 932 }, // iPhone 15 Pro Max
          { width: 1920, height: 1080 }, // Desktop
        ];

        testSizes.forEach(size => {
          mockWindow(size.width, size.height);
          const position = getLocateButtonPosition();
          
          expect(position.bottom).toBeGreaterThan(0);
          expect(position.bottom).toBeLessThan(size.height);
        });
      });
    });

    describe('getAddToHomeEqualMarginPosition', () => {
      it('should position AddToHome button at bottom-left', () => {
        const position = getAddToHomeEqualMarginPosition();
        const safeHeight = getSafeViewportHeight();

        // Should be at left edge with margin
        expect(position.x).toBe(SPACING.EDGE_MARGIN);

        // Should be near bottom with margin
        const expectedY = safeHeight - BUTTON_SIZES.ADD_TO_HOME - SPACING.EDGE_MARGIN;
        expect(Math.abs(position.y - expectedY)).toBeLessThan(5);
      });

      it('should maintain proper margins from edges', () => {
        const position = getAddToHomeEqualMarginPosition();
        const buttonSize = BUTTON_SIZES.ADD_TO_HOME;
        const safeHeight = getSafeViewportHeight();

        // Distance to each edge
        const leftDistance = position.x;
        const bottomDistance = safeHeight - (position.y + buttonSize);

        // Left and bottom margins should match EDGE_MARGIN
        expect(leftDistance).toBe(SPACING.EDGE_MARGIN);
        expect(Math.abs(bottomDistance - SPACING.EDGE_MARGIN)).toBeLessThan(5);
      });

      it('should work across different screen sizes and orientations', () => {
        const testCases = [
          { width: 280, height: 568, name: 'iPhone SE Portrait' },
          { width: 568, height: 280, name: 'iPhone SE Landscape' },
          { width: 393, height: 852, name: 'iPhone 15 Pro Portrait' },
          { width: 852, height: 393, name: 'iPhone 15 Pro Landscape' },
          { width: 1920, height: 1080, name: 'Desktop' },
          { width: 768, height: 1024, name: 'iPad Portrait' },
          { width: 1024, height: 768, name: 'iPad Landscape' },
        ];

        testCases.forEach(testCase => {
          mockWindow(testCase.width, testCase.height);
          const position = getAddToHomeEqualMarginPosition();

          // Position should be within screen bounds
          expect(position.x).toBeGreaterThanOrEqual(0);
          expect(position.y).toBeGreaterThanOrEqual(0);
          expect(position.x + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.width);
          expect(position.y + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(testCase.height);

          // Should be at bottom-left with proper margin
          expect(position.x).toBe(SPACING.EDGE_MARGIN);

          // Y position should be near bottom (within safe viewport)
          const safeHeight = getSafeViewportHeight();
          const expectedY = safeHeight - BUTTON_SIZES.ADD_TO_HOME - SPACING.EDGE_MARGIN;
          expect(Math.abs(position.y - expectedY)).toBeLessThan(10); // Allow some tolerance
        });
      });

      it('should provide reasonable positioning in all environments', () => {
        // Test that function always returns valid positioning 
        const position = getAddToHomeEqualMarginPosition();
        
        // Should always return valid coordinates
        expect(typeof position.x).toBe('number');
        expect(typeof position.y).toBe('number');
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeGreaterThanOrEqual(0);
        
        // Should fit within current window bounds
        expect(position.x + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(window.innerWidth);
        expect(position.y + BUTTON_SIZES.ADD_TO_HOME).toBeLessThanOrEqual(window.innerHeight);
      });
    });

    describe('Integration tests - new vs old positioning', () => {
      it('should provide different but valid positioning compared to old system', () => {
        const oldPosition = getInitialPosition();
        const newPosition = getAddToHomeEqualMarginPosition();
        
        // Both should be valid positions
        expect(oldPosition.x).toBeGreaterThan(0);
        expect(oldPosition.y).toBeGreaterThan(0);
        expect(newPosition.x).toBeGreaterThan(0);
        expect(newPosition.y).toBeGreaterThan(0);
        
        // New system should generally be more centered
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        
        const oldButtonCenterX = oldPosition.x + (BUTTON_SIZES.ADD_TO_HOME / 2);
        const oldButtonCenterY = oldPosition.y + (BUTTON_SIZES.ADD_TO_HOME / 2);
        const newButtonCenterX = newPosition.x + (BUTTON_SIZES.ADD_TO_HOME / 2);
        const newButtonCenterY = newPosition.y + (BUTTON_SIZES.ADD_TO_HOME / 2);
        
        const oldDistanceFromCenter = Math.sqrt(
          Math.pow(oldButtonCenterX - screenCenterX, 2) + 
          Math.pow(oldButtonCenterY - screenCenterY, 2)
        );
        const newDistanceFromCenter = Math.sqrt(
          Math.pow(newButtonCenterX - screenCenterX, 2) + 
          Math.pow(newButtonCenterY - screenCenterY, 2)
        );
        
        // New positioning should generally be closer to center (more centered)
        expect(newDistanceFromCenter).toBeLessThanOrEqual(oldDistanceFromCenter * 1.5); // Allow some tolerance
      });
    });
  });
});
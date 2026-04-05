import { describe, it, expect } from 'vitest';

import { DesktopNavigation } from './DesktopNavigation';

describe('DesktopNavigation', () => {
  it('should export component', () => {
    expect(DesktopNavigation).toBeDefined();
  });

  it('should be a function component', () => {
    expect(typeof DesktopNavigation).toBe('function');
  });
});

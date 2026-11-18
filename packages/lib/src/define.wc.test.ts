import { describe, it, expect, vi, afterEach } from 'vitest';
import { defineCustomElement } from './define';
import { elements, registerElements } from './register';

/**
 * Some publisher pages run the bundle twice (theme and plugin both include it,
 * or an ajax page swap re-runs it). The second run used to throw
 * "NotSupportedError: Cannot define multiple custom elements with the same tag
 * name" as an unhandled error. It must be a no-op instead.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

describe('defineCustomElement', () => {
  it('defines a tag that is not yet defined', () => {
    class First extends HTMLElement {}
    defineCustomElement('sesamy-define-test-new', First);
    expect(customElements.get('sesamy-define-test-new')).toBe(First);
  });

  it('does not throw when the same class is defined twice, and logs nothing', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    class First extends HTMLElement {}
    defineCustomElement('sesamy-define-test-same', First);
    expect(() => defineCustomElement('sesamy-define-test-same', First)).not.toThrow();
    expect(customElements.get('sesamy-define-test-same')).toBe(First);
    expect(debug).not.toHaveBeenCalled();
  });

  it('keeps the first definition when a second copy brings a different class', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    class First extends HTMLElement {}
    class Second extends HTMLElement {}
    defineCustomElement('sesamy-define-test-other', First);

    expect(() => defineCustomElement('sesamy-define-test-other', Second)).not.toThrow();
    expect(() => defineCustomElement('sesamy-define-test-other', Second)).not.toThrow();

    expect(customElements.get('sesamy-define-test-other')).toBe(First);
    expect(document.createElement('sesamy-define-test-other')).toBeInstanceOf(First);
    // Once per tag, at debug level, never as a warning or error.
    expect(debug).toHaveBeenCalledTimes(1);
  });
});

describe('registerElements', () => {
  it('defines every public tag, and running it again changes nothing', () => {
    registerElements();
    const first = Object.keys(elements).map((tag) => customElements.get(tag));
    expect(first.every(Boolean)).toBe(true);

    expect(() => registerElements()).not.toThrow();
    expect(Object.keys(elements).map((tag) => customElements.get(tag))).toEqual(first);
  });

  it('ignores an element another copy of the bundle registered first', () => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    registerElements();
    const original = customElements.get('sesamy-login');
    expect(original).toBeDefined();
    // A stand-in for a second, possibly different, copy of the bundle.
    class OtherCopy extends HTMLElement {}

    expect(() => defineCustomElement('sesamy-login', OtherCopy)).not.toThrow();
    expect(customElements.get('sesamy-login')).toBe(original);
  });
});

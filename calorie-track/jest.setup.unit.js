// Polyfills and test setup for unit tests (jsdom)
// Provide a minimal ResizeObserver implementation for tests that rely on it.
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof global.ResizeObserver === 'undefined') {
  // eslint-disable-next-line no-global-assign
  global.ResizeObserver = ResizeObserverMock;
}

// Silence Recharts ResponsiveContainer console warnings during tests by
// providing minimal layout values via CSS in the test environment isn't trivial,
// so tests will continue to render but warnings will be emitted. That's acceptable.

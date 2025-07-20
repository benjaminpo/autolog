import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { performance } from 'perf_hooks';

// Performance test utilities
const measureRenderTime = async (component: React.ReactElement) => {
  const startTime = performance.now();

  await act(async () => {
    render(component);
  });

  const endTime = performance.now();
  return endTime - startTime;
};

const createLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    value: Math.random() * 1000,
    date: new Date(2023, 0, 1 + i),
    category: i % 5 === 0 ? 'A' : i % 5 === 1 ? 'B' : i % 5 === 2 ? 'C' : i % 5 === 3 ? 'D' : 'E'
  }));
};

describe('Performance Tests', () => {
  describe('Component Rendering Performance', () => {
    it('should render simple components quickly', async () => {
      const SimpleComponent = () => <div>Hello World</div>;

      const renderTime = await measureRenderTime(<SimpleComponent />);

      expect(renderTime).toBeLessThan(200); // Should render in less than 200ms
    });

    it('should handle medium datasets efficiently', async () => {
      const data = createLargeDataset(100);

      const ListComponent = () => (
        <ul>
          {data.map(item => (
            <li key={item.id}>{item.name}: {item.value.toFixed(2)}</li>
          ))}
        </ul>
      );

      const renderTime = await measureRenderTime(<ListComponent />);

      expect(renderTime).toBeLessThan(500); // Should render 100 items in less than 500ms
    });
  });

  describe('Data Processing Performance', () => {
    it('should filter large datasets quickly', () => {
      const data = createLargeDataset(10000);

      const startTime = performance.now();
      const filtered = data.filter(item => item.value > 500);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should filter in less than 500ms (more lenient for test environment)
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should sort large datasets efficiently', () => {
      const data = createLargeDataset(10000);

      const startTime = performance.now();
      const sorted = [...data].sort((a, b) => a.value - b.value);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(250); // Should sort in less than 250ms
      expect(sorted[0].value).toBeLessThanOrEqual(sorted[sorted.length - 1].value);
    });

    it('should aggregate large datasets quickly', () => {
      const data = createLargeDataset(10000);

      const startTime = performance.now();
      const aggregated = data.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.value;
        return acc;
      }, {} as Record<string, number>);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should aggregate in less than 50ms
      expect(Object.keys(aggregated)).toHaveLength(5); // Should have 5 categories
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const data = createLargeDataset(100);
        const filtered = data.filter(item => item.value > 500);
        filtered.sort((a, b) => a.value - b.value);
        // Let data go out of scope
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Should not increase memory by more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Async Operations Performance', () => {
    it('should handle concurrent async operations efficiently', async () => {
      const asyncOperation = (delay: number) =>
        new Promise(resolve => setTimeout(resolve, delay));

      const startTime = performance.now();

      // Run 10 concurrent operations
      const promises = Array.from({ length: 10 }, () => asyncOperation(50));
      await Promise.all(promises);

      const endTime = performance.now();

      // Should complete all operations in roughly the delay time (not 10x delay)
      expect(endTime - startTime).toBeLessThan(150); // Some overhead is expected
      expect(endTime - startTime).toBeGreaterThan(40); // But should take at least the delay
    });

    it('should handle sequential operations within reasonable time', async () => {
      const operations = Array.from({ length: 5 }, (_, i) =>
        () => new Promise(resolve => setTimeout(() => resolve(i), 10))
      );

      const startTime = performance.now();

      const results = [];
      for (const operation of operations) {
        results.push(await operation());
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(150); // Should complete in reasonable time (adjusted for CI/test environment)
      expect(results).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('Component Re-render Performance', () => {
    it('should minimize re-renders with memoization', async () => {
      let renderCount = 0;

      const MemoizedComponent = React.memo(() => {
        renderCount++;
        return <div>Memoized Component</div>;
      });

      const ParentComponent = ({ value }: { value: number }) => (
        <div>
          <span>{value}</span>
          <MemoizedComponent />
        </div>
      );

      const { rerender } = render(<ParentComponent value={1} />);

      // Re-render with same props
      rerender(<ParentComponent value={1} />);
      rerender(<ParentComponent value={1} />);

      // Memoized component should only render once
      expect(renderCount).toBe(1);

      // Re-render with different props (parent re-renders but memoized child shouldn't)
      rerender(<ParentComponent value={2} />);

      expect(renderCount).toBe(1); // Still should be 1
    });
  });
});

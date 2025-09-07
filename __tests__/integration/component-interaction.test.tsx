/**
 * Component Integration Tests
 * Testing how different components interact with each other
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock components for testing interactions
const MockFormComponent = ({ onSubmit, initialData = {} }: { onSubmit: (data: any) => void; initialData?: any }) => {
  const [formData, setFormData] = React.useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="mock-form">
      <input
        name="name"
        value={formData.name || ''}
        onChange={handleChange}
        placeholder="Name"
        data-testid="name-input"
      />
      <input
        name="email"
        value={formData.email || ''}
        onChange={handleChange}
        placeholder="Email"
        data-testid="email-input"
      />
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
    </form>
  );
};

const MockDataDisplay = ({ data, onEdit }: { data: any[]; onEdit: (item: any) => void }) => {
  return (
    <div data-testid="data-display">
      {data.length === 0 ? (
        <p data-testid="no-data">No data available</p>
      ) : (
        <ul data-testid="data-list">
          {data.map((item, index) => (
            <li key={index} data-testid={`data-item-${index}`}>
              <span>{item.name} - {item.email}</span>
              <button
                onClick={() => onEdit(item)}
                data-testid={`edit-button-${index}`}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const MockModal = ({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="modal-overlay"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        data-testid="modal-content"
        role="dialog"
        aria-modal="true"
      >
        <button
          data-testid="modal-close"
          onClick={onClose}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

// Main integration component
const IntegratedApp = () => {
  const [data, setData] = React.useState<any[]>([]);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleFormSubmit = (formData: any) => {
    if (editingItem) {
      // Update existing item
      setData(prev =>
        prev.map(item =>
          item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
        )
      );
      setEditingItem(null);
    } else {
      // Add new item
      setData(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <div data-testid="integrated-app">
      <button
        onClick={handleAddNew}
        data-testid="add-new-button"
      >
        Add New
      </button>

      <MockDataDisplay data={data} onEdit={handleEdit} />

      <MockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <MockFormComponent
          onSubmit={handleFormSubmit}
          initialData={editingItem || {}}
        />
      </MockModal>
    </div>
  );
};

// Filter component for testing search functionality
const MockFilterComponent = ({
  data,
  onFilter
}: {
  data: any[];
  onFilter: (filtered: any[]) => void
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  React.useEffect(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    onFilter(filtered);
  }, [data, searchTerm, selectedCategory, onFilter]);

  return (
    <div data-testid="filter-component">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        data-testid="search-input"
      />
      <label htmlFor="category-select">Test Select</label>
      <select
        id="category-select"
        data-testid="category-select"
        title="Select an option"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="work">Work</option>
        <option value="personal">Personal</option>
      </select>
    </div>
  );
};

// Helper functions to reduce nesting
const createIncrementHandler = (setCount: (value: number) => void, setHistory: (updater: (prev: number[]) => number[]) => void, currentCount: number) => {
  return () => {
    const newCount = currentCount + 1;
    setCount(newCount);
    setHistory((prev: number[]) => [...prev, newCount]);
  };
};

const createDecrementHandler = (setCount: (value: number) => void, setHistory: (updater: (prev: number[]) => number[]) => void, currentCount: number) => {
  return () => {
    const newCount = currentCount - 1;
    setCount(newCount);
    setHistory((prev: number[]) => [...prev, newCount]);
  };
};

const createResetHandler = (setCount: (value: number) => void, setHistory: (value: number[]) => void) => {
  return () => {
    setCount(0);
    setHistory([0]);
  };
};

// Helper for async data fetching
const simulateAsyncFetch = async (shouldFail: boolean) => {
  await new Promise(resolve => setTimeout(resolve, 100));

  if (shouldFail) {
    throw new Error('API Error');
  }

  return [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ];
};

describe('Component Integration Tests', () => {
  describe('Form and Data Display Integration', () => {
    it('should add new items through form submission', async () => {
      const user = userEvent.setup();
      render(<IntegratedApp />);

      // Initially no data
      expect(screen.getByTestId('no-data')).toBeInTheDocument();

      // Click add new button
      await user.click(screen.getByTestId('add-new-button'));

      // Modal should open
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();

      // Fill form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');

      // Submit form
      await user.click(screen.getByTestId('submit-button'));

      // Modal should close and data should be displayed
      await waitFor(() => {
        expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('data-list')).toBeInTheDocument();
      expect(screen.getByText('John Doe - john@example.com')).toBeInTheDocument();
    });

    it('should edit existing items', async () => {
      const user = userEvent.setup();
      render(<IntegratedApp />);

      // Add initial item
      await user.click(screen.getByTestId('add-new-button'));
      await user.type(screen.getByTestId('name-input'), 'Jane Doe');
      await user.type(screen.getByTestId('email-input'), 'jane@example.com');
      await user.click(screen.getByTestId('submit-button'));

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
      });

      // Click edit button
      await user.click(screen.getByTestId('edit-button-0'));

      // Modal should open with pre-filled data
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();

      // Edit the data
      await user.clear(screen.getByTestId('name-input'));
      await user.type(screen.getByTestId('name-input'), 'Jane Smith');

      // Submit changes
      await user.click(screen.getByTestId('submit-button'));

      // Data should be updated
      await waitFor(() => {
        expect(screen.getByText('Jane Smith - jane@example.com')).toBeInTheDocument();
      });
    });

    it('should close modal without saving when clicking close button', async () => {
      const user = userEvent.setup();
      render(<IntegratedApp />);

      // Open modal
      await user.click(screen.getByTestId('add-new-button'));
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();

      // Fill some data
      await user.type(screen.getByTestId('name-input'), 'Test User');

      // Click close button to close modal
      await user.click(screen.getByTestId('modal-close'));

      // Modal should close without saving
      await waitFor(() => {
        expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
      });

      // No data should be saved
      expect(screen.getByTestId('no-data')).toBeInTheDocument();
    });
  });

  describe('Search and Filter Integration', () => {
    const FilteredApp = () => {
      const [allData] = React.useState([
        { id: 1, name: 'Alice', email: 'alice@work.com', category: 'work' },
        { id: 2, name: 'Bob', email: 'bob@personal.com', category: 'personal' },
        { id: 3, name: 'Charlie', email: 'charlie@work.com', category: 'work' },
      ]);
      const [filteredData, setFilteredData] = React.useState(allData);

      return (
        <div>
          <MockFilterComponent data={allData} onFilter={setFilteredData} />
          <MockDataDisplay data={filteredData} onEdit={() => {}} />
        </div>
      );
    };

    it('should filter data by search term', async () => {
      const user = userEvent.setup();
      render(<FilteredApp />);

      // Initially all data should be shown
      expect(screen.getByText('Alice - alice@work.com')).toBeInTheDocument();
      expect(screen.getByText('Bob - bob@personal.com')).toBeInTheDocument();
      expect(screen.getByText('Charlie - charlie@work.com')).toBeInTheDocument();

      // Search for "Alice"
      await user.type(screen.getByTestId('search-input'), 'Alice');

      // Only Alice should be shown
      await waitFor(() => {
        expect(screen.getByText('Alice - alice@work.com')).toBeInTheDocument();
        expect(screen.queryByText('Bob - bob@personal.com')).not.toBeInTheDocument();
        expect(screen.queryByText('Charlie - charlie@work.com')).not.toBeInTheDocument();
      });
    });

    it('should filter data by category', async () => {
      const user = userEvent.setup();
      render(<FilteredApp />);

      // Select work category
      await user.selectOptions(screen.getByTestId('category-select'), 'work');

      // Only work items should be shown
      await waitFor(() => {
        expect(screen.getByText('Alice - alice@work.com')).toBeInTheDocument();
        expect(screen.queryByText('Bob - bob@personal.com')).not.toBeInTheDocument();
        expect(screen.getByText('Charlie - charlie@work.com')).toBeInTheDocument();
      });
    });

    it('should combine search and category filters', async () => {
      const user = userEvent.setup();
      render(<FilteredApp />);

      // Search for "work" emails and select work category
      await user.type(screen.getByTestId('search-input'), 'charlie');
      await user.selectOptions(screen.getByTestId('category-select'), 'work');

      // Only Charlie should be shown
      await waitFor(() => {
        expect(screen.queryByText('Alice - alice@work.com')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob - bob@personal.com')).not.toBeInTheDocument();
        expect(screen.getByText('Charlie - charlie@work.com')).toBeInTheDocument();
      });
    });

    it('should show no results when filters match nothing', async () => {
      const user = userEvent.setup();
      render(<FilteredApp />);

      // Search for something that doesn't exist
      await user.type(screen.getByTestId('search-input'), 'nonexistent');

      // No data should be shown
      await waitFor(() => {
        expect(screen.getByTestId('no-data')).toBeInTheDocument();
      });
    });
  });

  describe('Event Propagation and Handling', () => {
    const EventTestComponent = () => {
      const [events, setEvents] = React.useState<string[]>([]);

      const addEvent = (event: string) => {
        setEvents(prev => [...prev, event]);
      };

      return (
        <div
          data-testid="event-container"
          onClick={() => addEvent('container-click')}
          onKeyDown={(e) => e.key === 'Enter' && addEvent('container-enter')}
          aria-label="Event testing container"
          tabIndex={0}
          role="button"
          className="w-full p-4 border border-gray-300 bg-transparent text-left cursor-pointer"
        >
          <button
            data-testid="propagation-button"
            onClick={(e) => {
              e.stopPropagation();
              addEvent('button-click');
            }}
          >
            Stop Propagation
          </button>

          <button
            data-testid="normal-button"
            onClick={() => addEvent('normal-button-click')}
          >
            Normal Button
          </button>

          <div data-testid="events-list">
            {events.map((event, index) => (
              <div key={index} data-testid={`event-${index}`}>
                {event}
              </div>
            ))}
          </div>
        </div>
      );
    };

    it('should handle event propagation correctly', async () => {
      const user = userEvent.setup();
      render(<EventTestComponent />);

      // Click button that stops propagation
      await user.click(screen.getByTestId('propagation-button'));

      // Only button event should be recorded
      expect(screen.getByTestId('event-0')).toHaveTextContent('button-click');
      expect(screen.queryByTestId('event-1')).not.toBeInTheDocument();

      // Click normal button
      await user.click(screen.getByTestId('normal-button'));

      // Both button and container events should be recorded
      await waitFor(() => {
        expect(screen.getByTestId('event-1')).toHaveTextContent('normal-button-click');
        expect(screen.getByTestId('event-2')).toHaveTextContent('container-click');
      });
    });
  });

  describe('State Management Integration', () => {
    const StateManagerComponent = () => {
      const [count, setCount] = React.useState(0);
      const [history, setHistory] = React.useState<number[]>([0]);

      const increment = createIncrementHandler(setCount, setHistory, count);
      const decrement = createDecrementHandler(setCount, setHistory, count);
      const reset = createResetHandler(setCount, setHistory);

      return (
        <div data-testid="state-manager">
          <div data-testid="current-count">Count: {count}</div>

          <button onClick={increment} data-testid="increment-button">
            +
          </button>
          <button onClick={decrement} data-testid="decrement-button">
            -
          </button>
          <button onClick={reset} data-testid="reset-button">
            Reset
          </button>

          <div data-testid="history">
            History: {history.join(', ')}
          </div>
        </div>
      );
    };

    it('should manage state correctly across multiple interactions', async () => {
      const user = userEvent.setup();
      render(<StateManagerComponent />);

      // Initial state
      expect(screen.getByTestId('current-count')).toHaveTextContent('Count: 0');
      expect(screen.getByTestId('history')).toHaveTextContent('History: 0');

      // Increment several times
      await user.click(screen.getByTestId('increment-button'));
      await user.click(screen.getByTestId('increment-button'));
      await user.click(screen.getByTestId('increment-button'));

      expect(screen.getByTestId('current-count')).toHaveTextContent('Count: 3');
      expect(screen.getByTestId('history')).toHaveTextContent('History: 0, 1, 2, 3');

      // Decrement
      await user.click(screen.getByTestId('decrement-button'));

      expect(screen.getByTestId('current-count')).toHaveTextContent('Count: 2');
      expect(screen.getByTestId('history')).toHaveTextContent('History: 0, 1, 2, 3, 2');

      // Reset
      await user.click(screen.getByTestId('reset-button'));

      expect(screen.getByTestId('current-count')).toHaveTextContent('Count: 0');
      expect(screen.getByTestId('history')).toHaveTextContent('History: 0');
    });
  });

  describe('Async Component Integration', () => {
    const AsyncComponent = () => {
      const [data, setData] = React.useState<any[]>([]);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState<string | null>(null);

      const fetchData = async (shouldFail = false) => {
        setLoading(true);
        setError(null);

        try {
          const mockData = await simulateAsyncFetch(shouldFail);
          setData(mockData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      return (
        <div data-testid="async-component">
          <button
            onClick={() => fetchData(false)}
            data-testid="fetch-success-button"
          >
            Fetch Data (Success)
          </button>

          <button
            onClick={() => fetchData(true)}
            data-testid="fetch-error-button"
          >
            Fetch Data (Error)
          </button>

          {loading && <div data-testid="loading">Loading...</div>}
          {error && <div data-testid="error">Error: {error}</div>}

          {data.length > 0 && (
            <div data-testid="data-container">
              {data.map(item => (
                <div key={item.id} data-testid={`item-${item.id}`}>
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    it('should handle successful async operations', async () => {
      const user = userEvent.setup();
      render(<AsyncComponent />);

      // Click fetch button
      await user.click(screen.getByTestId('fetch-success-button'));

      // Loading should appear
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('data-container')).toBeInTheDocument();
      });

      // Data should be displayed
      expect(screen.getByTestId('item-1')).toHaveTextContent('Item 1');
      expect(screen.getByTestId('item-2')).toHaveTextContent('Item 2');
    });

    it('should handle failed async operations', async () => {
      const user = userEvent.setup();
      render(<AsyncComponent />);

      // Click fetch error button
      await user.click(screen.getByTestId('fetch-error-button'));

      // Loading should appear
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Error should be displayed
      expect(screen.getByTestId('error')).toHaveTextContent('Error: API Error');
    });
  });
});

// React 19 custom hook for form controls
import { useCallback } from 'react';

/**
 * Hook to handle React 19's new form input behavior
 * Makes inputs explicitly controlled with proper value attribution
 */
export function useFormControl<T extends Record<string, unknown>>(
  formState: T,
  setFormState: (state: T) => void
) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;

      if (type === 'checkbox') {
        setFormState({
          ...formState,
          [name]: (e.target as HTMLInputElement).checked,
        });
      } else {
        setFormState({
          ...formState,
          [name]: value,
        });
      }
    },
    [formState, setFormState]
  );

  // Returns properties to apply to each input
  const inputProps = useCallback(
    (name: keyof T) => ({
      name: String(name),
      value: formState[name] ?? '',
      onChange: handleChange,
    }),
    [formState, handleChange]
  );

  // Special case for checkbox inputs
  const checkboxProps = useCallback(
    (name: keyof T) => ({
      name: String(name),
      checked: Boolean(formState[name]),
      onChange: handleChange,
    }),
    [formState, handleChange]
  );

  return {
    handleChange,
    inputProps,
    checkboxProps,
    formState,
  };
}

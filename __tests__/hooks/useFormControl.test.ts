import { renderHook, act } from '@testing-library/react'
import { useFormControl } from '../../app/hooks/useFormControl'
import { useState } from 'react'

describe('useFormControl', () => {
  it('should return correct hook interface', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState({ name: '', email: '' })
      return useFormControl(formState, setFormState)
    })
    
    expect(result.current).toHaveProperty('handleChange')
    expect(result.current).toHaveProperty('inputProps')
    expect(result.current).toHaveProperty('checkboxProps')
    expect(result.current).toHaveProperty('formState')
  })

  it('should return correct input props', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState({ name: 'John', email: 'john@test.com' })
      return useFormControl(formState, setFormState)
    })
    
    const nameProps = result.current.inputProps('name')
    expect(nameProps).toEqual({
      name: 'name',
      value: 'John',
      onChange: expect.any(Function)
    })
    
    const emailProps = result.current.inputProps('email')
    expect(emailProps).toEqual({
      name: 'email',
      value: 'john@test.com',
      onChange: expect.any(Function)
    })
  })

  it('should return correct checkbox props', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState({ isActive: true, isVisible: false })
      return useFormControl(formState, setFormState)
    })
    
    const activeProps = result.current.checkboxProps('isActive')
    expect(activeProps).toEqual({
      name: 'isActive',
      checked: true,
      onChange: expect.any(Function)
    })
    
    const visibleProps = result.current.checkboxProps('isVisible')
    expect(visibleProps).toEqual({
      name: 'isVisible',
      checked: false,
      onChange: expect.any(Function)
    })
  })

  it('should handle text input changes', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState({ name: '' })
      return useFormControl(formState, setFormState)
    })
    
    const mockEvent = {
      target: { 
        name: 'name',
        value: 'John Doe',
        type: 'text'
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    act(() => {
      result.current.handleChange(mockEvent)
    })
    
    expect(result.current.formState.name).toBe('John Doe')
  })

  it('should handle checkbox changes', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState({ isActive: false })
      return useFormControl(formState, setFormState)
    })
    
    const mockEvent = {
      target: { 
        name: 'isActive',
        type: 'checkbox',
        checked: true
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    act(() => {
      result.current.handleChange(mockEvent)
    })
    
    expect(result.current.formState.isActive).toBe(true)
  })

  it('should handle select changes', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState({ category: '' })
      return useFormControl(formState, setFormState)
    })
    
    const mockEvent = {
      target: { 
        name: 'category',
        value: 'maintenance',
        type: 'select-one'
      }
    } as React.ChangeEvent<HTMLSelectElement>
    
    act(() => {
      result.current.handleChange(mockEvent)
    })
    
    expect(result.current.formState.category).toBe('maintenance')
  })

  it('should handle multiple field updates', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState({ name: '', email: '', isActive: false })
      return useFormControl(formState, setFormState)
    })
    
    // Update name
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>)
    })
    
    // Update email
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'john@test.com', type: 'email' }
      } as React.ChangeEvent<HTMLInputElement>)
    })
    
    // Update checkbox
    act(() => {
      result.current.handleChange({
        target: { name: 'isActive', type: 'checkbox', checked: true }
      } as React.ChangeEvent<HTMLInputElement>)
    })
    
    expect(result.current.formState).toEqual({
      name: 'John',
      email: 'john@test.com',
      isActive: true
    })
  })

  it('should provide empty string for undefined values in inputProps', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState<Record<string, any>>({})
      return useFormControl(formState, setFormState)
    })
    
    const props = result.current.inputProps('nonExistentField')
    expect(props.value).toBe('')
  })

  it('should provide false for undefined values in checkboxProps', () => {
    const { result } = renderHook(() => {
      const [formState, setFormState] = useState<Record<string, any>>({})
      return useFormControl(formState, setFormState)
    })
    
    const props = result.current.checkboxProps('nonExistentField')
    expect(props.checked).toBe(false)
  })
}) 
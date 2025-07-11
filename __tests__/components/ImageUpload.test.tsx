import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUpload from '../../app/components/ImageUpload';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('ImageUpload Component', () => {
  const mockOnImagesChange = jest.fn();
  const defaultProps = {
    images: [],
    onImagesChange: mockOnImagesChange,
    maxImages: 5,
    label: 'Test Images',
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct label', () => {
    render(<ImageUpload {...defaultProps} />);
    expect(screen.getByText('Test Images')).toBeInTheDocument();
  });

  it('shows file input when under max images limit', () => {
    render(<ImageUpload {...defaultProps} images={['image1.jpg']} />);
    const fileInput = screen.getByDisplayValue('');
    expect(fileInput).toBeInTheDocument();
  });

  it('hides file input when at max images limit', () => {
    const images = ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg', 'image5.jpg'];
    render(<ImageUpload {...defaultProps} images={images} />);
    const fileInput = screen.queryByDisplayValue('');
    expect(fileInput).not.toBeInTheDocument();
  });

  it('displays image count correctly', () => {
    const images = ['image1.jpg', 'image2.jpg'];
    render(<ImageUpload {...defaultProps} images={images} />);
    expect(screen.getByText('2 of 5 images uploaded')).toBeInTheDocument();
  });

  it('shows image previews when images are provided', () => {
    const images = ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'];
    render(<ImageUpload {...defaultProps} images={images} />);
    
    const imageElements = screen.getAllByAltText(/Uploaded image/);
    expect(imageElements).toHaveLength(2);
  });

  it('disables file input when disabled prop is true', () => {
    render(<ImageUpload {...defaultProps} disabled={true} />);
    const fileInput = screen.getByDisplayValue('');
    expect(fileInput).toBeDisabled();
  });

  it('calls onImagesChange when file is selected', async () => {
    render(<ImageUpload {...defaultProps} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByDisplayValue('');
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnImagesChange).toHaveBeenCalled();
    });
  });

  it('removes image when remove button is clicked', () => {
    const images = ['data:image/jpeg;base64,test1'];
    render(<ImageUpload {...defaultProps} images={images} />);
    
    const removeButton = screen.getByRole('button', { name: /remove image/i });
    fireEvent.click(removeButton);
    
    expect(mockOnImagesChange).toHaveBeenCalledWith([]);
  });

  it('shows uploading message during file upload', async () => {
    render(<ImageUpload {...defaultProps} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByDisplayValue('');
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
  });
}); 
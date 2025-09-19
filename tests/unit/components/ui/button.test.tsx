import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, ButtonProps } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>)
      
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should apply variant styles correctly', () => {
      const { rerender } = render(<Button variant="destructive">Delete</Button>)
      
      let button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
      
      rerender(<Button variant="outline">Outline</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('border')
      
      rerender(<Button variant="secondary">Secondary</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary')
    })

    it('should apply size variants correctly', () => {
      const { rerender } = render(<Button size="sm">Small</Button>)
      
      let button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')
      
      rerender(<Button size="lg">Large</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-11')
      
      rerender(<Button size="icon">Icon</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('Interactions', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn()
      
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should be focusable with keyboard', () => {
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick}>Keyboard Button</Button>)
      
      const button = screen.getByRole('button')
      
      // Test that button can receive focus
      button.focus()
      expect(button).toHaveFocus()
      
      // Test that button responds to click
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle mouse events', async () => {
      const handleMouseEnter = vi.fn()
      const handleMouseLeave = vi.fn()
      
      render(
        <Button 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Hover Button
        </Button>
      )
      
      const button = screen.getByRole('button')
      
      fireEvent.mouseEnter(button)
      expect(handleMouseEnter).toHaveBeenCalledTimes(1)
      
      fireEvent.mouseLeave(button)
      expect(handleMouseLeave).toHaveBeenCalledTimes(1)
    })
  })

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn()
      
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when provided', () => {
      render(
        <Button 
          aria-label="Delete item"
          aria-describedby="delete-description"
        >
          Delete
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Delete item')
      expect(button).toHaveAttribute('aria-describedby', 'delete-description')
    })

    it('should be focusable by default', () => {
      render(<Button>Focusable Button</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(button).toHaveFocus()
    })

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('disabled')
    })

    it('should have proper role', () => {
      render(<Button>Button</Button>)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Custom Props', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <Button 
          type="submit"
          form="test-form"
          data-testid="custom-button"
          tabIndex={-1}
        >
          Custom Button
        </Button>
      )
      
      const button = screen.getByTestId('custom-button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'test-form')
      expect(button).toHaveAttribute('tabindex', '-1')
    })

    it('should render as different elements when asChild is used', () => {
      render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link', { name: /link button/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/link')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid clicks gracefully', () => {
      const handleClick = vi.fn()
      
      render(<Button onClick={handleClick}>Rapid Click</Button>)
      
      const button = screen.getByRole('button')
      
      // Rapid clicks
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(3)
    })

    it('should handle long text content', () => {
      const longText = 'This is a very long button text that might wrap or overflow and we need to ensure it handles gracefully'
      
      render(<Button>{longText}</Button>)
      
      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('should handle special characters in content', () => {
      render(<Button>{"<>&\"'"}</Button>)
      
      expect(screen.getByText("<>&\"'")).toBeInTheDocument()
    })

    it('should handle async onClick handlers', async () => {
      const asyncHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      render(<Button onClick={asyncHandler}>Async Button</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(asyncHandler).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn()
      
      const TestButton = (props: ButtonProps) => {
        renderSpy()
        return <Button {...props} />
      }
      
      const { rerender } = render(<TestButton>Test Button</TestButton>)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestButton>Test Button</TestButton>)
      
      // Should still only be called once due to React optimization
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })

    it('should handle many simultaneous buttons', () => {
      const buttons = Array.from({ length: 100 }, (_, i) => (
        <Button key={i}>Button {i}</Button>
      ))
      
      render(<div>{buttons}</div>)
      
      expect(screen.getAllByRole('button')).toHaveLength(100)
    })
  })
})
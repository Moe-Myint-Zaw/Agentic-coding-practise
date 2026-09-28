import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Home } from './Home'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/api'
import { BrowserRouter } from 'react-router-dom'

describe('Home', () => {
  it('renders home page', () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <Home />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    )
    const element = screen.getByText(/Yaycha/i)
    expect(element).toBeTruthy()
  })
})
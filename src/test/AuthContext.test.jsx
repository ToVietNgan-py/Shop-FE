// src/__tests__/AuthContext.test.jsx
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, AuthContext } from '@/context/AuthContext'
import * as authService from '@/services/authService'
// Mock service
vi.mock('@/services/authService')

function TestComponent() {
    const { user, login, logout } = useAuth()
    return (
        <div>
            <span data-testid="user">{user?.name ?? 'guest'}</span>
            <button onClick={() => login({ email: 'a@a.com', password: '123456' })}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    )
}

describe('AuthContext', () => {
    it('user mặc định là null (guest)', () => {
        render(<AuthProvider><TestComponent /></AuthProvider>)
        expect(screen.getByTestId('user')).toHaveTextContent('guest')
    })

    it('login thành công cập nhật user', async () => {
        authService.login.mockResolvedValue({ user: { name: 'Việt Ngân' }, token: 'abc' })
        const user = userEvent.setup()
        render(<AuthProvider><TestComponent /></AuthProvider>)
        await user.click(screen.getByText('Login'))
        expect(screen.getByTestId('user')).toHaveTextContent('Việt Ngân')
    })

    it('logout xoá user', async () => {
        // setup user đã login...
        const user = userEvent.setup()
        render(<AuthProvider><TestComponent /></AuthProvider>)
        await user.click(screen.getByText('Logout'))
        expect(screen.getByTestId('user')).toHaveTextContent('guest')
    })
})
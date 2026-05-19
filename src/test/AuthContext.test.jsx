import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, AuthContext } from '@/context/AuthContext'
import * as authService from '@/services/authService'
import { useContext } from 'react'

vi.mock('@/services/authService')

function TestComponent() {
    const { user, loginContext, logout } = useContext(AuthContext) // ← dùng useContext
    return (
        <div>
            <span data-testid="user">{user?.name ?? 'guest'}</span>
            <button onClick={() => loginContext({ user: { name: 'Việt Ngân' }, access_token: 'abc' })}>Login</button>
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
        authService.getProfile.mockResolvedValue({ user: null })
        const user = userEvent.setup()
        render(<AuthProvider><TestComponent /></AuthProvider>)
        await user.click(screen.getByText('Login'))
        expect(screen.getByTestId('user')).toHaveTextContent('Việt Ngân')
    })

    it('logout xoá user', async () => {
        const user = userEvent.setup()
        render(<AuthProvider><TestComponent /></AuthProvider>)
        await user.click(screen.getByText('Logout'))
        expect(screen.getByTestId('user')).toHaveTextContent('guest')
    })
})
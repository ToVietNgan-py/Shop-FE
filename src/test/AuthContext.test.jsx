import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, AuthContext } from '@/context/AuthContext'
import { useContext } from 'react'

vi.mock('@/services/authService', () => ({
    getProfile: vi.fn(),
}))

const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
}

vi.stubGlobal('localStorage', localStorageMock)

function TestComponent() {
    const { user, loginContext, logout } = useContext(AuthContext)

    return (
        <div>
            <span data-testid="user">
                {user?.name ?? 'guest'}
            </span>

            <button
                onClick={() =>
                    loginContext({
                        user: { name: 'Việt Ngân' },
                        access_token: 'abc',
                    })
                }
            >
                Login
            </button>

            <button onClick={logout}>
                Logout
            </button>
        </div>
    )
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('user mặc định là null (guest)', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        expect(await screen.findByTestId('user'))
            .toHaveTextContent('guest')
    })

    it('login thành công cập nhật user', async () => {
        const user = userEvent.setup()

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await user.click(await screen.findByText('Login'))

        expect(screen.getByTestId('user'))
            .toHaveTextContent('Việt Ngân')
    })

    it('logout xoá user', async () => {
        const user = userEvent.setup()

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await user.click(await screen.findByText('Logout'))

        expect(screen.getByTestId('user'))
            .toHaveTextContent('guest')
    })
})
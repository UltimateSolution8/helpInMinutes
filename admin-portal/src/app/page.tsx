import { redirect } from 'next/navigation';

export default function Home() {
  // Check if user is authenticated by checking localStorage
  // In a real app, this would use a proper auth check
  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('accessToken');

  if (isAuthenticated) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}

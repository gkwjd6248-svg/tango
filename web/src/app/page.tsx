import { redirect } from 'next/navigation';

// Root route redirects to the events listing page.
export default function RootPage() {
  redirect('/events');
}

import { redirect } from 'next/navigation';
import { getSession } from '@/actions/get-session';
import HomePageClient from './client';

export default async function HomePage() {
  const session = await getSession();

  console.dir(session, { depth: null });

  if (!session.ok) {
    redirect('/auth/sign-in?next=/');
  }

  // const trpc = useTRPC();
  // const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  // 	const [showSignIn, setShowSignIn] = useState(false);

  // return showSignIn ? (
  // 	<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  // ) : (
  // 	<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  // );

  return <HomePageClient />;
}

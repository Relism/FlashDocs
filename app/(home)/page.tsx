import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">Flash</h1>
      <p>
        A Java web framework. The{' '}
        <Link href="/docs" className="font-medium underline">
          documentation
        </Link>{' '}
        is here.
      </p>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image
        src="/images/tsk-logo.png"
        alt="TSK Logo"
        width={200}
        height={100}
        className="object-contain"
        priority
        style={{ maxHeight: '96px' }}
      />
    </Link>
  );
} 
"use client"

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { navLinks } from '@/lib/constants';


const LeftSideBar = () => {
  const pathname = usePathname();
  return (
    <div className="h-screen left-0 top-0 sticky p-10 flex flex-col justify-between bg-blue-2 shadow-xl max-lg:hidden">
      {/* Logo */}
      <Image src="/logo.png" alt="logo" width={160} height={40} />

      {/* Nav Links */}
      <div className="flex flex-col gap-12">
        {navLinks.map((link) => (
          <Link
            href={link.url}
            key={link.label}
            className={`flex items-center gap-4 text-body-medium ${pathname === link.url ? "text-blue-1" : "text-grey-1"}`}
          >
            {link.icon}
            <p>{link.label}</p>
          </Link>
        ))}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-4 text-body-medium">
        <UserButton />
        <p>Edit Profile</p>
      </div>
    </div>
  );
};

export default LeftSideBar;

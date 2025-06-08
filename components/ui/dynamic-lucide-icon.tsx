// filepath: d:\Semester 4\Pemweb\eco-journal\components\ui\dynamic-lucide-icon.tsx
'use client';

import * as LucideIcons from 'lucide-react';
import { SVGProps } from 'react';

interface DynamicLucideIconProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof LucideIcons | string; // Terima string juga untuk fleksibilitas
}

export const DynamicLucideIcon = ({ name, ...props }: DynamicLucideIconProps) => {
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<SVGProps<SVGSVGElement>>;

  if (!IconComponent) {
    // Fallback jika nama ikon tidak ditemukan di lucide-react
    // Anda bisa menampilkan ikon default atau null
    return <LucideIcons.HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
};
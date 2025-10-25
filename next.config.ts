import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Silence workspace root inference warning by pointing to this workspace
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

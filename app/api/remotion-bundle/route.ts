import { NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { join } from 'path';
import { existsSync } from 'fs';

let cachedBundleUrl: string | null = null;
let cachedBundlePath: string | null = null;
let bundleCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

const getWebpackConfig = (config: any) => {
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.push({
    test: /\.(mp4|webm|ogg)$/,
    type: 'asset/resource',
  });
  return config;
};

export async function GET() {
  try {
    const now = Date.now();
    const isCacheValid = cachedBundleUrl && cachedBundlePath && 
                        (now - bundleCacheTime) < CACHE_DURATION &&
                        existsSync(cachedBundlePath);

    if (isCacheValid) {
      return NextResponse.json({ success: true, bundleUrl: cachedBundleUrl });
    }

    const entryPoint = join(process.cwd(), 'remotion/root.tsx');
    if (!existsSync(entryPoint)) {
      return NextResponse.json(
        { success: false, error: 'Remotion root file not found' },
        { status: 404 }
      );
    }

    const bundled = await bundle({
      entryPoint,
      onProgress: (progress) => console.log(`Bundling: ${Math.round(progress * 100)}%`),
      webpackOverride: getWebpackConfig
    });

    cachedBundlePath = bundled;
    cachedBundleUrl = bundled;
    bundleCacheTime = now;

    return NextResponse.json({ success: true, bundleUrl: cachedBundleUrl });
  } catch (error) {
    console.error('Bundle creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bundle'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  cachedBundleUrl = null;
  cachedBundlePath = null;
  bundleCacheTime = 0;
  return NextResponse.json({ success: true, message: 'Cache cleared' });
}


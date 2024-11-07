'use client';

import React from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type { Cache } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';

const StyledComponentsRegistry = React.memo(({ children }: React.PropsWithChildren) => {
  const cache = React.useMemo<Cache>(() => createCache(), []);
  useServerInsertedHTML(() => (
    <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
  ));
  return <StyleProvider cache={cache}>{children}</StyleProvider>;
});

StyledComponentsRegistry.displayName = 'StyledComponentsRegistry';
export default StyledComponentsRegistry;

<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import icons from './../icons/icons.json';
  import type { IconName } from './../icons/types';

  type Props = {
    name: IconName;
    multiColor?: boolean;
    ratio?: number;
    [key: string]: any;
  };

  let { name, multiColor = false, ratio = 1, class: classes, ...rest }: Props = $props();

  const { elements, fills, strokes, viewBoxWidth, viewBoxHeight, widthRatio, heightRatio } =
    icons[name];
</script>

<svg
  class={twMerge(`icon-${name}`, classes)}
  viewBox={viewBoxWidth && viewBoxHeight ? `0 0 ${viewBoxWidth} ${viewBoxHeight}` : undefined}
  width={`${ratio * widthRatio}em`}
  height={`${ratio * heightRatio}em`}
  style={multiColor
    ? [
        ...fills.map((fill, i) => fill && `--${name}-fill-color-${i}: ${fill};`),
        ...strokes.map((stroke, i) => stroke && `--${name}-stroke-color-${i}: ${stroke};`)
      ]
        .filter(Boolean)
        .join('')
    : undefined}
  {...rest}
>
  {@html elements.join('')}
</svg>

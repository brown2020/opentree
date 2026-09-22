import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';

type ZoomRef = { current: ZoomBehavior<SVGSVGElement, unknown> | null };

/**
 * Attach d3-zoom to an SVG and return an explicit disposer.
 * Kept outside React effects so subscription ownership is clear.
 */
export function attachSvgZoom(
  svgEl: SVGSVGElement,
  dimensions: { width: number; height: number },
  onTransform: (t: ZoomTransform) => void,
  zoomRef: ZoomRef
): () => void {
  const svg = select(svgEl);
  const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      onTransform(event.transform);
    });

  zoomRef.current = zoomBehavior;
  svg.call(zoomBehavior);

  const initialTransform = zoomIdentity.translate(
    dimensions.width / 2,
    dimensions.height / 3
  );
  svg.call(zoomBehavior.transform, initialTransform);

  return () => {
    zoomBehavior.on('zoom', null);
    svg.on('.zoom', null);
    zoomRef.current = null;
  };
}

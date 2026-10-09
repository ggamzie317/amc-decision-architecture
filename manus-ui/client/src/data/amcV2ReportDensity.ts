/** Visual QA guard for intentional V2 report pages. Run at screen layout and before print. */
export type V2PageDensity = {
  page: number;
  occupied: number;
  available: number;
  ratio: number;
};
export function lowDensityPages(samples: V2PageDensity[], minimum = 0.35) {
  return samples.filter(
    sample => sample.available > 0 && sample.ratio < minimum
  );
}
export function inspectV2ReportDensity(root: HTMLElement): V2PageDensity[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".v2-paper-page")).map(
    (page, index) => {
      const body = page.querySelector<HTMLElement>(".v2-paper-body"),
        footer = page.querySelector<HTMLElement>("footer");
      const first = body?.getBoundingClientRect().top || 0;
      const available = Math.max(
        0,
        (footer?.getBoundingClientRect().top || 0) - first
      );
      const occupied = Math.max(
        0,
        (body?.lastElementChild?.getBoundingClientRect().bottom || first) -
          first
      );
      return {
        page: index + 1,
        occupied,
        available,
        ratio: available ? occupied / available : 0,
      };
    }
  );
}

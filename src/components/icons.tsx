import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svg(d: string) {
  return function Icon({ size = 16, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        <path d={d} />
      </svg>
    );
  };
}

export const PlusIcon = svg("M12 5v14M5 12h14");
export const SearchIcon = svg(
  "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
);
export const StarIcon = svg(
  "M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z",
);
export const RefreshIcon = svg(
  "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
);
export const TrashIcon = svg(
  "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
);
export const CheckIcon = svg("M20 6 9 17l-5-5");
export const FolderIcon = svg(
  "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
);
export const FolderOpenIcon = svg(
  "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3V7ZM3 9h18l-2 9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2L3 9Z",
);
export const ChevronRightIcon = svg("M9 6l6 6-6 6");
export const ChevronDownIcon = svg("M6 9l6 6 6-6");
export const RssIcon = svg(
  "M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
);
export const CloseIcon = svg("M18 6 6 18M6 6l12 12");
export const ArrowLeftIcon = svg("M19 12H5M12 19l-7-7 7-7");
export const InboxIcon = svg(
  "M22 12h-6l-2 3h-4l-2-3H2M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
);
export const UploadIcon = svg(
  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
);
export const DownloadIcon = svg(
  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
);
export const ExternalIcon = svg(
  "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
);

import { useReport } from '../panels/report-store';

const slug = (title: string): string =>
    title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'site-report';

// Rendered inline in the chat under the generateSiteReport call (not a floating panel). The HTML
// report is built from the results store; this offers Open-in-new-tab (a user click → no popup
// block) and Download.
export function ReportActions() {
    const data = useReport();
    if (!data) return null;

    const open = () => {
        const url = URL.createObjectURL(new Blob([data.html], { type: 'text/html' }));
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    };
    const download = () => {
        const url = URL.createObjectURL(new Blob([data.html], { type: 'text/html' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${slug(data.title)}.html`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="message assistant flex w-[90%] max-w-[90%] flex-col gap-2 self-start rounded-(--ui-rounded-5) border border-(--ui-border-low-em) bg-(--ui-surface-1) p-3">
            <span className="text-[13px] font-semibold text-(--ui-text-high-em)">{data.title}</span>
            <span className="text-[12px] text-(--ui-text-med-em)">
                Customer-ready report — open (print → PDF) or download.
            </span>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={open}
                    className="cursor-pointer rounded-(--ui-rounded-5) border-0 bg-(--ui-surface-brand-red) px-3 py-1.5 text-[13px] font-semibold text-white"
                >
                    Open report
                </button>
                <button
                    type="button"
                    onClick={download}
                    className="cursor-pointer rounded-(--ui-rounded-5) border border-(--ui-border-med-em) bg-(--ui-surface-0) px-3 py-1.5 text-[13px] font-semibold text-(--ui-text-high-em) transition-colors hover:bg-(--ui-surface-2)"
                >
                    Download .html
                </button>
            </div>
        </div>
    );
}

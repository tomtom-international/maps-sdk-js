import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv[2] ?? 'dev';
const reportPaths = process.argv.slice(3);

const packageDir = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(packageDir, '..');
const explorerDir = path.resolve(packageDir, 'eval-explorer');
const manifestPath = path.resolve(explorerDir, 'public/preloaded-reports.json');
const reportFilePattern = /^eval-report-.*\.json$/;

const resolveExistingPath = (inputPath) => {
    const candidates = path.isAbsolute(inputPath)
        ? [inputPath]
        : [
              path.resolve(process.cwd(), inputPath),
              path.resolve(workspaceRoot, inputPath),
              path.resolve(workspaceRoot, 'examples', inputPath),
          ];

    return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
};

const toWorkspaceRelative = (resolvedPath) => {
    const relativePath = path.relative(workspaceRoot, resolvedPath);
    return relativePath.startsWith('..') ? resolvedPath : relativePath;
};

const toLabel = (resolvedPath, index) => {
    const baseName = path.basename(resolvedPath, path.extname(resolvedPath));
    return index === 0 ? baseName : `${baseName}-${index + 1}`;
};

const listReportFiles = (directoryPath, originalInput) => {
    const reportPaths = fs
        .readdirSync(directoryPath, { withFileTypes: true })
        .filter((entry) => entry.isFile() && reportFilePattern.test(entry.name))
        .map((entry) => path.resolve(directoryPath, entry.name))
        .sort((left, right) => left.localeCompare(right));

    if (reportPaths.length === 0) {
        throw new Error(`No eval reports found in: ${originalInput}`);
    }

    return reportPaths;
};

const resolveReportInputs = (inputPath) => {
    const resolvedPath = resolveExistingPath(inputPath);
    if (!resolvedPath) {
        throw new Error(`Report file or example directory not found: ${inputPath}`);
    }

    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
        return listReportFiles(resolvedPath, inputPath);
    }

    if (!reportFilePattern.test(path.basename(resolvedPath))) {
        throw new Error(`Expected an eval report file or example directory: ${inputPath}`);
    }

    return [resolvedPath];
};

const loadReport = (resolvedPath, index) => {
    const text = fs.readFileSync(resolvedPath, 'utf8');
    const parsed = JSON.parse(text);

    return {
        id: `preloaded-${index + 1}`,
        label: toLabel(resolvedPath, index),
        source: toWorkspaceRelative(resolvedPath),
        report: parsed,
    };
};

const writeManifest = () => {
    const resolvedReportPaths = reportPaths.flatMap((reportPath) => resolveReportInputs(reportPath));
    const manifest = {
        reports: resolvedReportPaths.map((reportPath, index) => loadReport(reportPath, index)),
    };
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return manifest.reports.length;
};

const runVite = (viteMode) => {
    const args = ['exec', 'vite', '--config', './eval-explorer/vite.config.ts'];
    if (viteMode === 'build') {
        args.splice(2, 0, 'build');
    }

    const child = spawn('pnpm', args, {
        cwd: packageDir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });

    child.on('exit', (code) => {
        process.exit(code ?? 0);
    });
};

let preparedReportCount = 0;

try {
    preparedReportCount = writeManifest();
} catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown explorer setup error.';
    console.error(`[eval-explorer] ${message}`);
    process.exit(1);
}

if (mode === 'prepare') {
    console.log(
        `[eval-explorer] prepared ${preparedReportCount} report(s) at ${path.relative(packageDir, manifestPath)}`,
    );
} else if (mode === 'build') {
    runVite('build');
} else {
    runVite('dev');
}

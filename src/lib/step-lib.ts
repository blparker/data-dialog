import { TransformationStep } from './db/schema';

/**
 * Given a set of `TransformationStep`s, return a list of steps in topological order. If `targetStep` is provided,
 * return the steps in topological order up to and including `targetStep`.
 *
 * @param steps - The set of `TransformationStep`s to sort.
 * @param targetStep - The step to sort up to. If not provided, all steps will be sorted.
 * @returns The sorted list of `TransformationStep`s.
 */

export function sortTransformationSteps(steps: TransformationStep[], targetStep?: TransformationStep): TransformationStep[] {
    const byWrites: Map<string, TransformationStep> = new Map(steps.map((s) => [s.writes, s]));
    const out: TransformationStep[] = [];
    const seen = new Set<string>();

    function dfs(name: string) {
        if (seen.has(name)) return;
        if (!byWrites.has(name)) throw new Error(`Unknown node: ${name}`);

        const s = byWrites.get(name)!;
        s.reads.forEach(dfs);

        seen.add(name);
        out.push(s);
    }

    if (targetStep) {
        dfs(targetStep.writes);
    } else {
        for (const step of steps) {
            dfs(step.writes);
        }
    }

    return out;
}

export function computePreviewSteps(transformationSteps: TransformationStep[]): TransformationStep[] {
    // Create a map of steps by their writes name for easy lookup
    const byWrites = new Map(transformationSteps.map((s) => [s.writes, s]));

    // Create a set of all step IDs that are read by other steps
    const stepsThatAreRead = new Set<string>();
    for (const step of transformationSteps) {
        for (const readName of step.reads) {
            const readStep = byWrites.get(readName);
            if (readStep) {
                stepsThatAreRead.add(readStep.id);
            }
        }
    }

    // Find terminal steps (steps that aren't read by any other step)
    const terminalSteps = transformationSteps.filter((step) => !stepsThatAreRead.has(step.id));

    // Find join steps (steps that read from multiple sources)
    // const joinSteps = transformationSteps.filter((step) => step.reads.length >= 2 && step.type === 'join');

    // // Get the latest join step if any exist
    // const latestJoinStep =
    //     joinSteps.length > 0
    //         ? joinSteps.reduce((latest, current) => (new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest))
    //         : null;

    // Combine terminal steps with the latest join step
    // const previewSteps = latestJoinStep ? [...terminalSteps, latestJoinStep] : terminalSteps;
    const previewSteps = terminalSteps;

    // Remove duplicates (in case the latest join step is also a terminal step)
    const uniqueSteps = previewSteps.filter((step, index, array) => array.findIndex((s) => s.id === step.id) === index);

    return uniqueSteps;
}

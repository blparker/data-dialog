'use server';

import { SourceStepData } from '@/lib/types/steps';
import { dataSourceById, countOfStepsForChat } from '../queries/datasource';
import { DataSource, TransformationStep } from '../schema';
import { computePreviewSteps } from '@/lib/step-lib';
import { createStep } from '../queries/steps';
import { qi } from '@/lib/utils';

export async function dataSourcesForPreviewSteps({
    steps,
}: {
    steps: TransformationStep[];
}): Promise<{ step: TransformationStep; dataSource: DataSource | null }[]> {
    const byWrites = new Map(steps.map((s) => [s.writes, s]));
    const previewSteps = computePreviewSteps(steps);

    const results: { step: TransformationStep; dataSource: DataSource | null }[] = await Promise.all(
        previewSteps.map(async (step) => {
            const src = nearestSource(step.writes, byWrites);
            if (!src) {
                return {
                    step,
                    dataSource: null,
                };
            }

            const dataSourceId = (src.data as SourceStepData).dataSourceId;
            if (!dataSourceId) {
                return {
                    step,
                    dataSource: null,
                };
            }

            const dataSource = await dataSourceById({ id: dataSourceId });

            return {
                step,
                dataSource: dataSource ?? null,
            };
        })
    );

    return results;
}

export async function createSourceStep({ chatId, dataSourceId }: { chatId: string; dataSourceId: string }): Promise<TransformationStep> {
    const sourceStepData: SourceStepData = {
        type: 'source',
        dataSourceId,
    };

    const count = await countOfStepsForChat({ chatId });
    const sql = `SELECT * FROM ${qi(dataSourceId)}`;

    return await createStep({
        newStep: {
            chatId,
            type: 'source',
            data: sourceStepData,
            writes: `t${count}`,
            sql,
        },
    });
}

function nearestSource(stepWrites: string, byWrites: Map<string, TransformationStep>): TransformationStep | null {
    const seen = new Set<string>();
    const stack = [stepWrites];
    while (stack.length) {
        const w = stack.pop()!;
        if (seen.has(w)) continue;
        seen.add(w);
        const s = byWrites.get(w);
        if (!s) continue;
        if (s.type === 'source') return s;
        for (const r of s.reads ?? []) stack.push(r);
    }
    return null;
}

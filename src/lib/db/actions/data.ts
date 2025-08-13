'use server';

import { DataSchema, DataType } from '@/lib/types/data';
import { stepsForChatId } from '../queries/steps';
import { TransformationStep } from '../schema';
import { EditFieldsStepData, SourceStepData } from '@/lib/types/steps';
import { describeSql, executeSql } from '../queries/analysis-db';
import { TableDataFetchResponse } from '@/lib/types/table';
import { sortTransformationSteps } from '@/lib/step-lib';

export async function schemaAtStep({ chatId, stepId }: { chatId: string; stepId: string }): Promise<DataSchema> {
    const allSteps = await stepsForChatId({ chatId });
    const targetStep = allSteps.find((step) => step.id === stepId);
    if (!targetStep) {
        throw new Error(`Step ${stepId} not found`);
    }

    return await resolveSchemaForStep(chatId, allSteps, targetStep);
}

export async function dataAtStep({
    chatId,
    stepId,
    page,
    pageSize = 100,
}: {
    chatId: string;
    stepId: string;
    page: number;
    pageSize?: number;
}): Promise<TableDataFetchResponse> {
    const allSteps = await stepsForChatId({ chatId });
    const sql = buildSqlForStep(allSteps, stepId, { offset: page * pageSize, limit: pageSize });
    const rows = await executeSql<Record<string, DataType>>(chatId, sql);

    const countSql = buildSqlForStep(allSteps, stepId, { countOnly: true });
    const [{ count }] = await executeSql<{ count: number }>(chatId, countSql);

    return {
        rows,
        totalRows: count,
        currentPage: page,
    };
}

function buildSqlForStep(
    allSteps: TransformationStep[],
    targetStepId: string,
    config: { offset?: number; limit?: number; countOnly?: boolean } = { offset: 0, limit: 100, countOnly: false }
): string {
    const targetStep = allSteps.find((step) => step.id === targetStepId);
    if (!targetStep) {
        throw new Error(`Step ${targetStepId} not found`);
    }

    const ancestors = sortTransformationSteps(allSteps, targetStep);
    const ctes = ancestors.map((s) => `${qi(s.writes)} AS (${s.sql})`).join(',\n ');

    const countOnlyTail = config.countOnly ? 'COUNT(*) as count' : '*';
    const offsetTail = config.offset ? `OFFSET ${config.offset}` : '';
    const limitTail = config.limit ? `LIMIT ${config.limit}` : '';
    const selectTail = `SELECT ${countOnlyTail} FROM ${qi(targetStep.writes)} ${offsetTail} ${limitTail}`;

    return `WITH ${ctes} ${selectTail.trim()}`;
}

const IDENT = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/;
function qi(name: string) {
    if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
    return `"${name}"`;
}

async function resolveSchemaForStep(chatId: string, allSteps: TransformationStep[], targetStep: TransformationStep): Promise<DataSchema> {
    if (targetStep.type === 'source') {
        return await getSourceSchema(chatId, targetStep);
    }

    const parentStep = allSteps.find((step) => step.id === targetStep.parentStepId);
    if (!parentStep) {
        throw new Error(`Parent step not found for ${targetStep.id}`);
    }

    const parentSchema = await resolveSchemaForStep(chatId, allSteps, parentStep);
    return applyStepTransformation(parentSchema, targetStep);
}

function applyStepTransformation(schema: DataSchema, step: TransformationStep): DataSchema {
    switch (step.type) {
        case 'edit-fields':
            return applyEditFieldsStepTransformation(schema, step.data as EditFieldsStepData);
        default:
            return schema;
    }
}

function applyEditFieldsStepTransformation(schema: DataSchema, data: EditFieldsStepData): DataSchema {
    const { overrides } = data;
    let newSchema = [...schema];

    for (const override of overrides) {
        const fieldIndex = newSchema.findIndex((field) => field.id === override.fieldId);

        if (fieldIndex === -1) {
            continue; // Field not found, skip
        }

        if (override.isDeleted) {
            // Remove the field
            newSchema.splice(fieldIndex, 1);
        } else {
            // Update the field
            newSchema[fieldIndex] = {
                ...newSchema[fieldIndex],
                name: override.newName ?? newSchema[fieldIndex].name,
                type: override.newType ?? newSchema[fieldIndex].type,
            };
        }
    }

    return newSchema;
}

async function getSourceSchema(chatId: string, targetStep: TransformationStep): Promise<DataSchema> {
    const data = targetStep.data as SourceStepData;
    const dataSourceId = data.dataSourceId;

    const describeResult = await describeSql(chatId, `SELECT * FROM "${dataSourceId}"`);
    return describeResult.map((result) => ({
        id: generateFieldId(result.column_name),
        name: result.column_name,
        type: mapDuckDBTypeToDataType(result.column_type),
    }));
}

function generateFieldId(fieldName: string) {
    const baseId = fieldName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    return baseId;
}

function mapDuckDBTypeToDataType(duckDBType: string): DataType {
    const type = duckDBType.toLowerCase();

    if (type.includes('varchar') || type.includes('char') || type.includes('text')) {
        return 'string';
    }
    if (type.includes('int') || type.includes('float') || type.includes('double') || type.includes('decimal')) {
        return 'number';
    }
    if (type.includes('date')) {
        return 'date';
    }
    if (type.includes('timestamp')) {
        return 'datetime';
    }
    if (type.includes('bool')) {
        return 'boolean';
    }

    // Default to string for unknown types
    return 'string';
}

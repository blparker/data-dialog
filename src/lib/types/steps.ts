import { DataType } from './data';

export type SourceStepData = {
    type: 'source';
    dataSourceId: string;
};

export type EditFieldsOverride = {
    fieldId: string;
    newName?: string;
    newType?: DataType;
    isDeleted?: boolean;
};

export type EditFieldsStepData = {
    type: 'edit-fields';
    overrides: EditFieldsOverride[];
};

export type StepData = SourceStepData | EditFieldsStepData;
export type StepType = StepData['type'];
export const StepTypes = ['source', 'edit-fields'] as const satisfies readonly StepType[];

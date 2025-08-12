export type DataType = 'string' | 'number' | 'date' | 'datetime' | 'boolean';

export type DataField = {
    id: string;
    name: string;
    type: DataType;
};

export type DataSchema = DataField[];

import '@testing-library/jest-dom';
import { schemaAtStep } from '@/lib/db/actions/data';

describe('schemaAtStep', () => {
    it('should return the schema for a step', async () => {
        const schema = await schemaAtStep({
            chatId: '40d9cfda-f76d-45ff-9f97-c30de63abe20',
            stepId: '205a76de-c500-4aa0-83de-570c88974ed6',
        });
        console.log('*** Schema = ', schema);
    });
});

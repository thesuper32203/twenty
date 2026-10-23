import { Module } from '@nestjs/common';

import { IMPORT_HISTORY_MUTATION_HOOKS } from 'src/modules/homeowner-import/query-hooks/import-history-mutation.pre-query-hooks';

@Module({ providers: IMPORT_HISTORY_MUTATION_HOOKS })
export class ImportHistoryQueryHookModule {}

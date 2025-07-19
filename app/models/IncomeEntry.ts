import mongoose from 'mongoose';
import { IBaseFinancialEntry, createBaseFinancialEntrySchema } from './BaseFinancialEntry';

// IncomeEntry type alias for the base financial entry
export type IIncomeEntry = IBaseFinancialEntry;

const IncomeEntrySchema = createBaseFinancialEntrySchema();

export default mongoose.models.IncomeEntry || mongoose.model<IIncomeEntry>('IncomeEntry', IncomeEntrySchema);
